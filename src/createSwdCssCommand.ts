// createSwdCssCommand.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * createSwdCssFile:
 * - รับ TextDocument ที่เป็นไฟล์ .css.ts
 * - สร้างไฟล์ name.css (เดิมเคยเป็น name.swd.css)
 * - วางไว้ใน src/styledwindcss (ถ้ายังไม่มีโฟลเดอร์ ก็สร้าง)
 * - insert import แบบ relative path ที่บรรทัดแรกของไฟล์ .css.ts
 * - ถ้ามี import เก่าอยู่ (เช่น ../styledwindcss/name.css) -> ลบก่อนแล้วค่อยใส่ใหม่
 */
export async function createSwdCssFile(doc: vscode.TextDocument) {
  // 1) เช็คไฟล์ลงท้าย .css.ts ?
  if (!doc.fileName.endsWith('.css.ts')) {
    return;
  }

  // 2) แยกชื่อไฟล์
  const fileName = path.basename(doc.fileName); // ex. "test.css.ts"
  const base = fileName.replace(/\.css\.ts$/, ''); // -> "test"

  // 3) หา workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  const rootPath = workspaceFolders[0].uri.fsPath;

  // 4) สร้าง folder "src/styledwindcss" ถ้ายังไม่มี
  const styledwindFolder = path.join(rootPath, 'src', 'styledwindcss');
  if (!fs.existsSync(styledwindFolder)) {
    fs.mkdirSync(styledwindFolder, { recursive: true });
  }

  // 5) ตั้งชื่อไฟล์ .css (แทน .swd.css เดิม)
  const newCssFilePath = path.join(styledwindFolder, base + '.css');

  // 6) ถ้ายังไม่มีไฟล์ ก็สร้างเปล่า ๆ
  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 7) คำนวณ relative path จากไฟล์ .css.ts -> .css
  const currentDir = path.dirname(doc.fileName);
  let rel = path.relative(currentDir, newCssFilePath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  const importLine = `import "${rel}";\n`;

  // 8) อ่าน text เดิม
  const fullText = doc.getText();

  // 9) ลบ import เก่า (ทับ path เก่า) เผื่อ user ย้ายไฟล์
  const sanitizedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldImportRegex = new RegExp(
    `^import\\s+["'][^"']*${sanitizedBase}\\.css["'];?\\s*(?:\\r?\\n)?`,
    'm'
  );
  let newText = fullText.replace(oldImportRegex, '');

  // 10) ลบ blank lines ซ้อน
  newText = newText.replace(/\n{2,}/g, '\n');

  // 11) เตรียม text สุดท้าย -> import ใหม่ + ส่วนที่เหลือ
  const finalText = importLine + newText;

  // 12) replace ทั้งไฟล์
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);
  await vscode.workspace.applyEdit(edit);

  vscode.window.showInformationMessage(`Created/Updated .css => ${rel}`);
}

/**
 * registerCreateSwdCssCommand:
 * - ถ้าต้องการให้เป็น command manual (Ctrl+Shift+P -> create swd.css)
 * - แต่ตอนนี้เราจะสร้างเป็น .css แทน .swd.css แล้ว
 */
export function registerCreateSwdCssCommand(context: vscode.ExtensionContext) {
  const cmdDisposable = vscode.commands.registerCommand('styledwind.createSwdCssFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor');
      return;
    }
    await createSwdCssFile(editor.document);
  });

  context.subscriptions.push(cmdDisposable);
}
