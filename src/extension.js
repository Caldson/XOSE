"use strict";
const vscode = require("vscode");
const fs = require("node:fs/promises");
const { encode, decode, isXose } = require("./encoding");

function nonce() { return Math.random().toString(36).slice(2); }
function toHex(bytes) { return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" "); }
function fromHex(text) {
  const clean = String(text || "").replace(/[^0-9a-f]/gi, "");
  const out = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return Uint8Array.from(out);
}
function html(webview, bytes, text) {
  const n = nonce();
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${n}';"><style>
  body{margin:0;background:var(--vscode-editor-background);color:var(--vscode-foreground);font-family:var(--vscode-font-family);font-size:13px}.top{display:flex;gap:8px;align-items:center;padding:10px;border-bottom:1px solid var(--vscode-panel-border)}.top b{font-size:14px}.top .sp{margin-left:auto;color:var(--vscode-descriptionForeground);font-size:11px}button{padding:6px 10px;border:1px solid var(--vscode-button-background);border-radius:6px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);font:inherit;font-weight:700;cursor:pointer}.wrap{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px;height:calc(100vh - 55px);box-sizing:border-box}textarea{width:100%;height:100%;box-sizing:border-box;resize:none;padding:8px;border:1px solid var(--vscode-input-border);border-radius:6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);font-family:var(--vscode-editor-font-family,monospace);font-size:12px;line-height:1.6}.label{display:block;margin-bottom:4px;color:var(--vscode-descriptionForeground);font-size:10px;font-weight:700}.col{display:flex;flex-direction:column;min-height:0}</style></head><body>
  <div class="top"><b>XOSHEX</b><span class="sp">XOSE 0.1.0 · 2-byte code units</span><button id="save">保存 XOSE</button><button id="decode">从文本重新编码</button></div>
  <div class="wrap"><div class="col"><span class="label">HEX（可编辑字节）</span><textarea id="hex">${toHex(bytes)}</textarea></div><div class="col"><span class="label">解码文本（可编辑）</span><textarea id="text">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</textarea></div></div>
  <script nonce="${n}">const v=acquireVsCodeApi();const $=id=>document.getElementById(id);$("save").onclick=()=>v.postMessage({type:"save",hex:$("hex").value,text:$("text").value});$("decode").onclick=()=>v.postMessage({type:"decode",text:$("text").value});window.addEventListener("message",e=>{const m=e.data||{};if(m.type==="bytes"){$("hex").value=m.hex;$("text").value=m.text}});</script></body></html>`;
}

async function openHex(context) {
  const editor = vscode.window.activeTextEditor;
  const file = editor && editor.document.uri.fsPath;
  if (!file) { vscode.window.showErrorMessage("请先打开一个文件"); return; }
  const bytes = new Uint8Array(await fs.readFile(file));
  const text = isXose(bytes) ? decode(bytes) : bytes.toString("utf8");
  const panel = vscode.window.createWebviewPanel("xose.hex", `XOSHEX · ${file.split(/[\\/]/).pop()}`, vscode.ViewColumn.Active, { enableScripts: true, retainContextWhenHidden: true });
  let current = bytes;
  panel.webview.html = html(panel.webview, current, text);
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.type === "save") {
      const raw = fromHex(message.hex);
      current = raw;
      await fs.writeFile(file, raw);
      vscode.window.showInformationMessage("XOSE 已保存");
    } else if (message.type === "decode") {
      current = encode(message.text || "");
      panel.webview.postMessage({ type: "bytes", hex: toHex(current), text: decode(current) });
    }
  });
}

async function encodeFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const target = await vscode.window.showSaveDialog({ filters: { XOSE: ["xose"] }, saveLabel: "编码为 XOSE" });
  if (!target) return;
  await fs.writeFile(target.fsPath, encode(editor.document.getText()));
  vscode.window.showInformationMessage("已编码为 XOSE");
}

async function decodeFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const bytes = new Uint8Array(await fs.readFile(editor.document.uri.fsPath));
  const doc = await vscode.workspace.openTextDocument({ content: decode(bytes), language: "plaintext" });
  await vscode.window.showTextDocument(doc);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("xose.openHex", () => openHex(context)),
    vscode.commands.registerCommand("xose.encodeFile", encodeFile),
    vscode.commands.registerCommand("xose.decodeFile", decodeFile)
  );
}
function deactivate() {}
module.exports = { activate, deactivate };
