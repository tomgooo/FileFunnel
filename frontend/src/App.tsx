import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { ListFiles, PickDirectory, CopyFiles } from "../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";
import { main } from "../wailsjs/go/models";


type FileInfo = main.FileInfo;

type ProgressPayload = {
    stage: "start" | "done" | "error";
    index: number;
    total: number;
    src: string;
    message: string;
};

export default function App() {
    const [srcDir, setSrcDir] = useState("");
    const [destDir, setDestDir] = useState("");

    const [recursive, setRecursive] = useState(true);
    const [includeDirs, setIncludeDirs] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "size" | "mtime">("name");
    const [desc, setDesc] = useState(false);

    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    // 复制顺序（用数组维护顺序）
    const selectedList = useMemo(() => {
        return files.filter((f) => selected[f.fullPath]);
    }, [files, selected]);

    const [progress, setProgress] = useState<ProgressPayload | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const off = EventsOn("copy:progress", (payload: ProgressPayload) => {
            setProgress(payload);
        });
        return () => {
            try {
                EventsOff("copy:progress");
            } catch {}
            // 某些版本 off 是函数，也可能是 undefined，这里不强依赖
            try {
                off?.();
            } catch {}
        };
    }, []);

    const pickSrc = async () => {
        const dir = await PickDirectory("选择源目录");
        if (dir) setSrcDir(dir);
    };

    const pickDest = async () => {
        const dir = await PickDirectory("选择目标目录");
        if (dir) setDestDir(dir);
    };

    const load = async () => {
        setError("");
        setFiles([]);
        setSelected({});
        if (!srcDir) {
            setError("请先选择源目录");
            return;
        }
        try {
            const res = await ListFiles({
                dir: srcDir,
                recursive,
                includeDirs,
                filterText,
                sortBy,
                desc,
            });
            setFiles(res);
        } catch (e: any) {
            setError(e?.message || String(e));
        }
    };

    const toggle = (fp: string) => {
        setSelected((m) => ({ ...m, [fp]: !m[fp] }));
    };

    // 上/下移动：通过交换 files 数组位置决定复制顺序
    const move = (fp: string, delta: number) => {
        const idx = files.findIndex((f) => f.fullPath === fp);
        if (idx < 0) return;
        const j = idx + delta;
        if (j < 0 || j >= files.length) return;
        const next = [...files];
        [next[idx], next[j]] = [next[j], next[idx]];
        setFiles(next);
    };

    const copy = async () => {
        setError("");
        setProgress(null);

        if (!destDir) {
            setError("请先选择目标目录");
            return;
        }
        if (selectedList.length === 0) {
            setError("请至少选择一个文件");
            return;
        }

        // Order 按当前 files 的顺序来：越靠前越先复制
        const orderMap: Record<string, number> = {};
        files.forEach((f, i) => (orderMap[f.fullPath] = i));

        const items = selectedList
            .slice()
            .sort((a, b) => orderMap[a.fullPath] - orderMap[b.fullPath])
            .map((f, i) => ({
                src: f.fullPath,
                order: i + 1,
                newName: "", // 你后面要“插入顺序号”就从这里生成新名字
            }));

        try {
            const req = main.CopyRequest.createFrom({
                dest: destDir,
                overwrite: false,
                items: items.map((it) => main.CopyItem.createFrom(it)),
            });

            const summary = await CopyFiles(req);
            alert(`复制完成：${summary.copied}/${summary.total}`);
        } catch (e: any) {
            setError(e?.message || String(e));
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>FileFunnel</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button onClick={pickSrc}>选择源目录</button>
                <span>源目录：{srcDir || "(未选择)"}</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <label>
                    <input type="checkbox" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} />
                    递归
                </label>
                <label>
                    <input type="checkbox" checked={includeDirs} onChange={(e) => setIncludeDirs(e.target.checked)} />
                    也列出目录
                </label>

                <input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="过滤：包含关键词"
                />

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="name">按名称</option>
                    <option value="size">按大小</option>
                    <option value="mtime">按修改时间</option>
                </select>

                <label>
                    <input type="checkbox" checked={desc} onChange={(e) => setDesc(e.target.checked)} />
                    倒序
                </label>

                <button onClick={load}>加载文件列表</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button onClick={pickDest}>选择目标目录</button>
                <span>目标目录：{destDir || "(未选择)"}</span>
                <button onClick={copy}>按当前顺序复制所选</button>
            </div>

            {progress && (
                <div style={{ marginBottom: 8 }}>
                    进度：[{progress.stage}] {progress.index}/{progress.total} - {progress.message}
                </div>
            )}

            {error && <div style={{ color: "red", marginBottom: 8 }}>错误：{error}</div>}

            <div style={{ maxHeight: 500, overflow: "auto", border: "1px solid #333", padding: 8 }}>
                {files.map((f) => (
                    <div key={f.fullPath} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                        <input type="checkbox" checked={!!selected[f.fullPath]} onChange={() => toggle(f.fullPath)} />
                        <span style={{ width: 60 }}>{f.isDir ? "[目录]" : "[文件]"}</span>
                        <span style={{ flex: 1, wordBreak: "break-all" }}>{f.relPath || f.name}</span>
                        <button onClick={() => move(f.fullPath, -1)}>↑</button>
                        <button onClick={() => move(f.fullPath, +1)}>↓</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
