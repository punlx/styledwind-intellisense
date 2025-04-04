// createSwdCssCommand.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * createSwdCssFile:
 * - ตรวจไฟล์ .swd.ts ปัจจุบัน (ผ่าน doc)
 * - สร้างไฟล์ .swd.css ชื่อเดียวกัน (ตัด .swd.ts => .swd.css)
 * - วางในโฟลเดอร์เดียวกัน (ข้าง ๆ)
 * - insert import "./xxx.swd.css" ที่บรรทัดแรก
 */
export async function createSwdCssFile(doc: vscode.TextDocument) {
  // 1) เช็คไฟล์ลงท้าย ".swd.ts" ไหม
  if (!doc.fileName.endsWith('.swd.ts')) {
    return;
  }

  // 2) basename => "xxx.swd.ts" => "xxx"
  const fileName = path.basename(doc.fileName); // ex. "app.swd.ts"
  const base = fileName.replace(/\.swd\.ts$/, ''); // -> "app"

  // 3) เอา dir ของ doc => จะสร้างไฟล์ .swd.css ข้าง ๆ
  const currentDir = path.dirname(doc.fileName);
  const newCssFilePath = path.join(currentDir, base + '.swd.css'); // ex. ".../app.swd.css"

  // 4) ถ้าไฟล์ .swd.css ยังไม่มี => สร้างเปล่า
  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 5) วาง import line => "./app.swd.css"
  const relImport = `./${base}.swd.css`; // เพราะอยู่ dir เดียวกัน
  const importLine = `import "${relImport}";\n`;

  // 6) ลบ import เก่าที่เคยอ้างอิง .swd.css เดียวกัน (ถ้าเคยมี)
  const sanitizedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldRegex = new RegExp(
    `^import\\s+["'][^"']*${sanitizedBase}\\.swd\\.css["'];?\\s*(?:\\r?\\n)?`,
    'm'
  );
  const fullText = doc.getText();
  let newText = fullText.replace(oldRegex, '');

  // ลบ blank lines ซ้อน
  newText = newText.replace(/\n{2,}/g, '\n');

  // 7) สร้าง final text => import line + โค้ดเดิม
  const finalText = importLine + newText;

  // 8) แทนที่เนื้อหาไฟล์
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);

  await vscode.workspace.applyEdit(edit);
}
