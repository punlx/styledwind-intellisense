// createSwdCssCommand.ts
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
   สำหรับฟีเจอร์ theme/globalDefineMap (คล้าย @const แต่ประกาศระดับ global)
   - หากต้องการ parse เพิ่มจากไฟล์อื่น หรือ theme.define(...) ก็สามารถขยาย logic ได้
   ------------------------------------------------------------------------- */
export const globalDefineMap: Record<string, Record<string, IStyleDefinition>> = {};

/* -------------------------------------------------------------------------
   Section C: abbrMap + known states/pseudos
   (ตัวอย่างสั้น ๆ หากต้องการเพิ่มเติม ให้ใส่ใน abbrMap ได้)
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   Section D: Helper สำหรับสร้าง styleDef / parse abbr / etc.
   ------------------------------------------------------------------------- */

/** แยก abbrLine => ตัวอย่าง "bg[red]" => ["bg","red"] **/

/** replace "--xxx" => "var(--xxx)" **/

/* -------------------------------------------------------------------------
   parseVariableAbbr + buildVariableName (รองรับ $bg-hover => base: "bg", suffix: "hover")
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
  checkAndReplaceLocalVarUsage
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   Section E: parseSingleAbbr - parse base/state/pseudo/... + !important checks
   ------------------------------------------------------------------------- */

/** parseStateStyle - ex. hover(bg[red]) **/

/* -------------------------------------------------------------------------
   Section M: ฟังก์ชันหลัก generateSwdCssFromSource
   ------------------------------------------------------------------------- */
function generateSwdCssFromSource(sourceText: string): string {
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

  // 7) loop => transformVariables + transformLocalVariables => buildCss
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
   Section N: ฟังก์ชันหลัก createSwdCssFile(doc)
   - command สำหรับ extension
   ------------------------------------------------------------------------- */
export async function createSwdCssFile(doc: vscode.TextDocument) {
  // 1) ตรวจไฟล์ .swd.ts
  if (!doc.fileName.endsWith('.swd.ts')) {
    return;
  }

  // 2) basename => "xxx.swd.ts" => "xxx"
  const fileName = path.basename(doc.fileName); // ex. "app.swd.ts"
  const base = fileName.replace(/\.swd\.ts$/, ''); // -> "app"

  // 3) สร้างไฟล์ .swd.css ข้าง ๆ
  const currentDir = path.dirname(doc.fileName);
  const newCssFilePath = path.join(currentDir, base + '.swd.css');

  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 4) ใส่ import "./xxx.swd.css"
  const relImport = `./${base}.swd.css`;
  const importLine = `import '${relImport}';\n`;

  // ลบ import เดิม
  const sanitizedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldRegex = new RegExp(
    `^import\\s+["'][^"']*${sanitizedBase}\\.swd\\.css["'];?\\s*(?:\\r?\\n)?`,
    'm'
  );
  const fullText = doc.getText();
  let newText = fullText.replace(oldRegex, '');
  newText = newText.replace(/\n{2,}/g, '\n');

  // prepend import line
  const finalText = importLine + newText;

  // replace doc
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);
  await vscode.workspace.applyEdit(edit);

  // 5) parse => generate
  const sourceText = finalText.replace(importLine, '');
  let generatedCss = '';
  try {
    generatedCss = generateSwdCssFromSource(sourceText);
  } catch (e: any) {
    vscode.window.showErrorMessage(`Styledwind parse error: ${e.message}`);
  }

  // 6) เขียนไฟล์ .swd.css
  fs.writeFileSync(newCssFilePath, generatedCss, 'utf8');

  // // 7) notify
  // vscode.window.showInformationMessage(`Generated CSS to "${base}.swd.css" done!`);
}
