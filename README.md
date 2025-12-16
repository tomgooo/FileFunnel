# FileFunnel

> A Wails (Go) desktop app that copies scattered files into a target folder in a custom order.  
> Tech stack: **Wails v2 + Go + React + TypeScript + Vite** (Windows-first).

## Why FileFunnel

When files are scattered across multiple folders, manually copying them into one place **in a specific order** is slow and error-prone.  
FileFunnel lets you:

- Collect files from different directories
- Assign / adjust a custom order (1..N)
- Copy them into **one** destination folder
- Get clear progress + logs for reliability and troubleshooting

## Features

- ✅ **Ordered batch copy**: copy files in your defined sequence
- ✅ **Cross-folder collection**: files can come from different paths
- ✅ **Rename on copy** (optional): keep original names or generate new names
- ✅ **Overwrite control**: prevent accidental replacement
- ✅ **Progress & logging**: track success/failure per item
- ✅ **Windows-friendly paths**: handles common Windows path quirks (long paths, separators, etc.)

> Add/remove items, re-order, and re-run without re-selecting everything.

## Demo

> Put screenshots / GIFs here.

- Screenshot: UI overview
- GIF: drag / reorder + start copy
- Screenshot: result folder + logs

Example:

```text
Before:
D:\test\a.txt
D:\test\fine\b.txt
D:\do\c.txt
D:\test\d.txt

Order:
a -> 1
b -> 2
d -> 3
c -> 4

After (Destination C:\target\):
01_a.txt
02_b.txt
03_d.txt
04_c.txt
````

## Architecture

* **Frontend**: React + TypeScript + Vite (UI, ordering, validation)
* **Backend**: Go (copy engine, filesystem operations, logging, error handling)
* **Bridge**: Wails bindings (frontend calls Go methods)

High-level flow:

1. User selects files
2. UI builds an ordered list
3. UI sends a `CopyRequest` to Go backend
4. Backend validates + copies sequentially (or controlled concurrency)
5. Backend returns results (success/failure + message)
6. UI renders progress + summary

## Tech Stack

* **Wails v2**
* **Go**
* **React**
* **TypeScript**
* **Vite**
* (Optional) Tailwind / AntD / MUI (depending on your UI choice)

## Project Structure

> Adjust to your repo layout.

```text
FileFunnel/
├─ backend/                  # Go domain + services
│  ├─ app.go                 # Wails app entry & bindings
│  ├─ service/               # copy service, validation, logging
│  └─ ...
├─ frontend/                 # React + TS (Vite)
│  ├─ src/
│  ├─ package.json
│  └─ ...
├─ wails.json
└─ README.md
```

## Getting Started

### Prerequisites

* Go (recommended: 1.21+)
* Node.js (recommended: 18+)
* Wails CLI v2

### Install Wails

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Run in dev mode

```bash
wails dev
```

### Build

```bash
wails build
```

> After build, the executable will be generated under the `build/` directory (depending on your config).

## Usage

1. Open FileFunnel
2. Add files (from multiple folders)
3. Set the desired order (drag/drop or order number)
4. Choose destination folder
5. Click **Start**
6. Check results and logs

## Configuration

> If you have runtime config, document it here.

* `overwrite`: `true/false`
* `renameStrategy`: original / prefix index / custom template
* `logLevel`: info / warn / error

## Roadmap

* [ ] Drag & drop reordering UX polish
* [ ] Copy queue pause/resume
* [ ] Parallel copy (with safe throttling)
* [ ] Export/Import task list (JSON)
* [ ] Conflict resolution UI (skip/overwrite/rename)
* [ ] History & recent destinations

## Troubleshooting

* **Build fails due to missing Node deps**
  Run:

  ```bash
  cd frontend
  npm i
  cd ..
  wails dev
  ```

* **Windows long path issues**
  Enable long paths in Windows policy (if needed) and keep paths consistent.

## Contributing

This project is currently used as a personal portfolio project.
If you want to suggest improvements, feel free to open an issue.

## License

No license yet (portfolio stage). Add one later if/when open-sourcing.

## Author

* Name: tomgooo
