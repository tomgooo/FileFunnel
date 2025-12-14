// frontend/src/App.tsx
import { useState } from "react";
import "./App.css";

// 从 wails 生成的 ts 绑定文件里引入
import { ListFiles } from "../wailsjs/go/main/App";
import type { main } from "../wailsjs/go/models"; // 里面有 main.FileInfo 的类型定义

type FileInfo = main.FileInfo;

function App() {
    const [dir, setDir] = useState("D:\\\\Video\\\\"); // 注意：在 JS 字符串里要用 \\ 表示 \
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [error, setError] = useState("");

    const handleLoad = async () => {
        try {
            setError("");
            const result = await ListFiles(dir);
            setFiles(result);
        } catch (e: any) {
            setError(e?.message || String(e));
        }
    };

    return (
        <div className="App">
            <h1>文件浏览器 (Wails + Go)</h1>

            <div style={{ marginBottom: "1rem" }}>
                <input
                    style={{ width: "500px" }}
                    value={dir}
                    onChange={(e) => setDir(e.target.value)}
                    placeholder="输入需要查看的绝对路径，例如 D:\\Video\\"
                />
                <button onClick={handleLoad} style={{ marginLeft: "8px" }}>
                    读取文件
                </button>
            </div>

            {error && <div style={{ color: "red" }}>错误：{error}</div>}

            <ul>
                {files.map((f) => (
                    <li key={f.fullPath}>
                        {f.isDir ? "[目录]" : "[文件]"} {f.name} ({f.size} bytes)
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
