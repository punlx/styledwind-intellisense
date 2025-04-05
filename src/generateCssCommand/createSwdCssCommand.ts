// src/generateCssCommand/createSwdCssCommand.ts

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IStyleDefinition } from './types';

import { ensureScopeUnique } from './utils/ensureScopeUnique';
import { parseDirectives } from './parsers/parseDirectives';
import { processClassBlocks } from './helpers/processClassBlocks';
import { handleBindDirectives } from './utils/handleBindDirectives';
import { transFormVariables } from './transformers/transformVariables';
import { transformLocalVariables } from './transformers/transformLocalVariables';
import { buildCssText } from './builders/buildCssText';

/* -------------------------------------------------------------------------
   globalDefineMap – ถ้าต้องการฟีเจอร์ @const / theme.define ข้ามไฟล์
------------------------------------------------------------------------- */
export const globalDefineMap: Record<string, Record<string, IStyleDefinition>> = {};

/* -------------------------------------------------------------------------
   ฟังก์ชัน generateSwdCssFromSource - parse + generate CSS (ไม่มี Diagnostic)
------------------------------------------------------------------------- */
export function generateSwdCssFromSource(sourceText: string): string {
  // 1) parseDirectives
  const { directives, classBlocks, constBlocks } = parseDirectives(sourceText);

  // 2) หา scope (@scope)
  const scopeDir = directives.find((d) => d.name === 'scope');
  if (!scopeDir) {
    throw new Error(`[SWD-ERR] You must provide "@scope <name>" in styled(...) block.`);
  }
  const scopeName = scopeDir.value;

  // 3) ensureScopeUnique(scopeName)
  ensureScopeUnique(scopeName);

  // 4) สร้าง map const => partial styleDef
  const constMap = new Map<string, IStyleDefinition>();
  for (const c of constBlocks) {
    constMap.set(c.name, c.styleDef);
  }

  // 5) processClassBlocks => ได้ map<finalKey, styleDef>
  const classNameDefs = processClassBlocks(scopeName, classBlocks, constMap);

  // 6) handleBindDirectives
  handleBindDirectives(scopeName, directives, classNameDefs);

  // 7) transformVariables + transformLocalVariables => buildCss
  let finalCss = '';
  for (const [displayKey, styleDef] of classNameDefs.entries()) {
    const className = displayKey.replace(`${scopeName}_`, ''); // pure class name
    transFormVariables(styleDef, scopeName, className);
    transformLocalVariables(styleDef, scopeName, className);
    finalCss += buildCssText(displayKey, styleDef);
  }

  return finalCss;
}

/* -------------------------------------------------------------------------
   ฟังก์ชัน createSwdCssFile(doc)
   – ทำหน้าที่: 
     1) แก้ import line ในไฟล์ .swd.ts
     2) generate CSS (ถ้า parse error => throw)
     3) เขียนไฟล์ .swd.css
   – **ไม่มี** การ set Diagnostic ในนี้
------------------------------------------------------------------------- */
export async function createSwdCssFile(doc: vscode.TextDocument) {
  // 1) เช็คไฟล์
  if (!doc.fileName.endsWith('.swd.ts')) {
    return;
  }

  // 2) basename => "xxx.swd.ts" => "xxx"
  const fileName = path.basename(doc.fileName);
  const base = fileName.replace(/\.swd\.ts$/, '');

  // 3) สร้างไฟล์ .swd.css ถ้ายังไม่มี
  const currentDir = path.dirname(doc.fileName);
  const newCssFilePath = path.join(currentDir, base + '.swd.css');
  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 4) ใส่ import "./xxx.swd.css" ในไฟล์ .swd.ts
  const relImport = `./${base}.swd.css`;
  const importLine = `import '${relImport}';\n`;

  const fullText = doc.getText();
  const sanitizedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldRegex = new RegExp(
    `^import\\s+["'][^"']*${sanitizedBase}\\.swd\\.css["'];?\\s*(?:\\r?\\n)?`,
    'm'
  );
  let newText = fullText.replace(oldRegex, '');
  newText = newText.replace(/\n{2,}/g, '\n');
  const finalText = importLine + newText;

  // apply edit
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);
  await vscode.workspace.applyEdit(edit);

  // 5) parse + generate
  const sourceText = finalText.replace(importLine, '');
  let generatedCss: string;
  try {
    generatedCss = generateSwdCssFromSource(sourceText);
  } catch (err) {
    // parse error => โยน error กลับ
    // (จะแจ้ง error ที่ไหนก็ตามสะดวก – ที่นี่ลองใส่ showErrorMessage หรือไม่ก็ได้)
    vscode.window.showErrorMessage(`Styledwind parse error: ${(err as Error).message}`);
    throw err;
  }

  // 6) เขียนไฟล์ .swd.css
  fs.writeFileSync(newCssFilePath, generatedCss, 'utf8');
}
