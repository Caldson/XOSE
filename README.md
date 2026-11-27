# XOSE / XOSHEX 0.1.0

VS Code extension for **XOSE (XOS Encoding)** and **XOSHEX**, a hexadecimal editor for XOSE text.

## Features

- `.xose` file language association
- `XOSE: 将当前文本编码为 XOSE`
- `XOSE: 将当前文件解码为 UTF-8`
- `XOSE: 打开 XOSHEX 十六进制编辑器`
- XOSHEX shows editable hex bytes and decoded text side by side
- XOSE binary format: `XOSE` magic + version 1 + 16-bit big-endian code units

## XOSE 0.1.0 ranges

- `00-17`: controls (`NUL`, `SPA`, `ESC`, function keys, arrows, `CTRL`)
- `18-31`: A-Z
- `32-4B`: a-z
- `4C-55`: 0-9
- `56-7C`: symbols
- `7D-99`: more letters
- `9A-137`: Japanese (hiragana + katakana, `137` = `ー`)
- `138-13F`: Chinese (`一 二 三 十 百 千 万 億`)

## Build

```bash
npx @vscode/vsce package --allow-missing-repository
```
