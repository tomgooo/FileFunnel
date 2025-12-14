package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
}

// FileInfo 你原来脚本没有这个结构体，这里加一个方便前端接收
type FileInfo struct {
	Name     string `json:"name"`
	FullPath string `json:"fullPath"`
	IsDir    bool   `json:"isDir"`
	Size     int64  `json:"size"`
}

// NewApp creates a new App application struct//NewApp 创建一个新的 App 应用程序结构
func NewApp() *App {
	return &App{}
}

func (a *App) ListFiles(dir string) ([]FileInfo, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	result := make([]FileInfo, 0, len(entries))

	for _, e := range entries {
		info, err := e.Info()
		if err != nil {
			continue
		}

		result = append(result, FileInfo{
			Name:     e.Name(),
			FullPath: filepath.Join(dir, e.Name()),
			IsDir:    e.IsDir(),
			Size:     info.Size(),
		})
	}
	return result, nil
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods 应用程序启动时调用startup。上下文已保存，以便我们可以调用运行时方法
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name//Greet 返回给定名称的问候语
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
