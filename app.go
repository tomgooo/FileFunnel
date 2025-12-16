package main

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

// PickDirectory ---------- 1) 目录选择对话框 ----------
func (a *App) PickDirectory(title string) (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	if err != nil {
		return "", err
	}
	// 用户点了取消：返回空字符串，不算错误
	return dir, nil
}

// ListOptions ---------- 2) 递归遍历 + 3) 排序/过滤 ----------
type ListOptions struct {
	Dir         string `json:"dir"`
	Recursive   bool   `json:"recursive"`
	IncludeDirs bool   `json:"includeDirs"`
	FilterText  string `json:"filterText"` // 简单包含过滤（不区分大小写）
	SortBy      string `json:"sortBy"`     // "name" | "size" | "mtime"
	Desc        bool   `json:"desc"`
}

type FileInfo struct {
	Name     string `json:"name"`
	FullPath string `json:"fullPath"`
	RelPath  string `json:"relPath"`
	IsDir    bool   `json:"isDir"`
	Size     int64  `json:"size"`
	ModTime  int64  `json:"modTime"` // unix 秒
}

func (a *App) ListFiles(opt ListOptions) ([]FileInfo, error) {
	dir := strings.TrimSpace(opt.Dir)
	if dir == "" {
		return nil, fmt.Errorf("dir 不能为空")
	}

	// 过滤关键字
	ft := strings.ToLower(strings.TrimSpace(opt.FilterText))

	var out []FileInfo

	addOne := func(path string, d fs.DirEntry) error {
		// 目录是否要返回
		if d.IsDir() && !opt.IncludeDirs {
			return nil
		}
		name := d.Name()
		if ft != "" && !strings.Contains(strings.ToLower(name), ft) {
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return nil // 某些文件拿不到信息就跳过
		}

		rel, _ := filepath.Rel(dir, path)
		out = append(out, FileInfo{
			Name:     name,
			FullPath: path,
			RelPath:  rel,
			IsDir:    d.IsDir(),
			Size:     info.Size(),
			ModTime:  info.ModTime().Unix(),
		})
		return nil
	}

	if opt.Recursive {
		err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			// 跳过根目录本身（否则会把根目录也算一个条目）
			if path == dir {
				return nil
			}
			return addOne(path, d)
		})
		if err != nil {
			return nil, err
		}
	} else {
		entries, err := os.ReadDir(dir)
		if err != nil {
			return nil, err
		}
		for _, d := range entries {
			path := filepath.Join(dir, d.Name())
			_ = addOne(path, d)
		}
	}

	// 排序
	sortBy := strings.ToLower(strings.TrimSpace(opt.SortBy))
	if sortBy == "" {
		sortBy = "name"
	}
	sort.Slice(out, func(i, j int) bool {
		less := false
		switch sortBy {
		case "size":
			less = out[i].Size < out[j].Size
		case "mtime":
			less = out[i].ModTime < out[j].ModTime
		default: // name
			less = strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name)
		}
		if opt.Desc {
			return !less
		}
		return less
	})

	return out, nil
}

// CopyItem ---------- 4) 按顺序复制（并发出进度事件） ----------
type CopyItem struct {
	Src     string `json:"src"`
	Order   int    `json:"order"`   // 前端决定顺序
	NewName string `json:"newName"` // 为空则用源文件名
}

type CopyRequest struct {
	Dest      string     `json:"dest"`
	Overwrite bool       `json:"overwrite"`
	Items     []CopyItem `json:"items"`
}

type CopySummary struct {
	Total    int    `json:"total"`
	Copied   int    `json:"copied"`
	FailedAt string `json:"failedAt"` // 出错时是哪个 src
}

func (a *App) CopyFiles(req CopyRequest) (CopySummary, error) {
	dest := strings.TrimSpace(req.Dest)
	if dest == "" {
		return CopySummary{}, fmt.Errorf("dest 不能为空")
	}
	if len(req.Items) == 0 {
		return CopySummary{}, fmt.Errorf("items 不能为空")
	}
	if err := os.MkdirAll(dest, 0755); err != nil {
		return CopySummary{}, err
	}

	// 按 Order 排序，保证严格顺序
	items := append([]CopyItem(nil), req.Items...)
	sort.Slice(items, func(i, j int) bool { return items[i].Order < items[j].Order })

	total := len(items)
	summary := CopySummary{Total: total, Copied: 0}

	for idx, it := range items {
		src := strings.TrimSpace(it.Src)
		if src == "" {
			continue
		}

		// 进度事件：开始
		runtime.EventsEmit(a.ctx, "copy:progress", map[string]any{
			"stage":   "start",
			"index":   idx + 1,
			"total":   total,
			"src":     src,
			"message": "开始复制",
		})

		if err := copyOneFile(src, dest, it.NewName, req.Overwrite); err != nil {
			summary.FailedAt = src
			// 进度事件：失败
			runtime.EventsEmit(a.ctx, "copy:progress", map[string]any{
				"stage":   "error",
				"index":   idx + 1,
				"total":   total,
				"src":     src,
				"message": err.Error(),
			})
			return summary, err
		}

		summary.Copied++

		// 进度事件：完成
		runtime.EventsEmit(a.ctx, "copy:progress", map[string]any{
			"stage":   "done",
			"index":   idx + 1,
			"total":   total,
			"src":     src,
			"message": "复制完成",
		})
	}

	return summary, nil
}

func copyOneFile(src, destDir, newName string, overwrite bool) error {
	stat, err := os.Stat(src)
	if err != nil {
		return err
	}
	if stat.IsDir() {
		return fmt.Errorf("不支持复制目录: %s", src)
	}

	name := strings.TrimSpace(newName)
	if name == "" {
		name = filepath.Base(src)
	}
	destPath := filepath.Join(destDir, name)

	// 不允许覆盖：目标存在就报错
	if !overwrite {
		if _, err := os.Stat(destPath); err == nil {
			return fmt.Errorf("目标已存在且不允许覆盖: %s", destPath)
		}
	}

	// 允许覆盖：这里直接创建/截断目标文件
	return streamCopyDirect(src, destPath)
}

func streamCopyDirect(src, destPath string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	// 直接写目标路径：Create 会创建或截断
	out, err := os.Create(destPath)
	if err != nil {
		return err
	}

	// 如果复制失败，确保关闭句柄
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, in); err != nil {
		// 可选兜底：复制失败就删掉“半截文件”
		_ = out.Close()
		_ = os.Remove(destPath)
		return err
	}

	// 刷盘
	if err := out.Sync(); err != nil {
		_ = out.Close()
		_ = os.Remove(destPath)
		return err
	}

	return out.Close()
}

func tempName(finalName, src string) string {
	h := sha1.Sum([]byte(src + time.Now().String()))
	return fmt.Sprintf(".%s.%s.tmp", finalName, hex.EncodeToString(h[:6]))
}
