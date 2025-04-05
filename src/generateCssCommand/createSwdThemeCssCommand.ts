// createSwdThemeCssCommand.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { abbrMap } from './constants/abbrMap'; // <-- import มาให้แล้ว เอาไปใช้เลย

/* ----------------------------------------------------------------------------------
   1) คัดลอก logic หลัก ๆ จากไฟล์ theme.ts (เฉพาะส่วนที่ใช้จริง)
      ได้แก่ generatePaletteCSS, parseKeyframeString, generateVariableCSS
      (และตัวช่วยอื่น ๆ เช่น parseKeyframeAbbr)
---------------------------------------------------------------------------------- */

// ---------------------- simulate from theme.ts ----------------------
function generatePaletteCSS(colors: string[][]): string {
  // ตัวอย่าง logic (แก้ไขให้ได้รูปแบบ html.dark{ --blue-100:... }
  const modes = colors[0]; // e.g. ['dark', 'light', 'dim']
  const colorRows = colors.slice(1); // e.g. [ ['blue-100','#3f1818','#BBDEFB','#90CAF9'], ... ]

  let cssResult = '';
  for (let i = 0; i < modes.length; i++) {
    const modeName = modes[i];
    let classBody = '';
    for (let j = 0; j < colorRows.length; j++) {
      const row = colorRows[j];
      const colorName = row[0];
      const colorValue = row[i + 1];
      classBody += `--${colorName}:${colorValue};`;
    }
    cssResult += `html.${modeName}{${classBody}}`;
  }
  return cssResult;
}

// ตัวช่วย parseKeyframe
function parseKeyframeAbbr(
  abbrBody: string,
  keyframeName: string,
  blockLabel: string
): { cssText: string; varMap: Record<string, string>; defaultVars: Record<string, string> } {
  const regex = /([\w\-\$]+)\[(.*?)\]/g;
  let match: RegExpExecArray | null;

  let cssText = '';
  const varMap: Record<string, string> = {};
  const defaultVars: Record<string, string> = {};

  while ((match = regex.exec(abbrBody)) !== null) {
    let styleAbbr = match[1];
    let propVal = match[2];

    if (propVal.includes('--')) {
      // แทน var(--xxx)
      propVal = propVal.replace(/(--[\w-]+)/g, 'var($1)');
    }

    let isVar = false;
    if (styleAbbr.startsWith('$')) {
      isVar = true;
      // ตัด '$' ออกก่อน เพื่อนำไป map กับ abbrMap
      styleAbbr = styleAbbr.slice(1);
    }

    // แปลง shorthand => abbrMap เช่น bg => background-color, c => color
    // หากไม่เจอใน map ให้ใช้ชื่อเดิม
    const finalProp = abbrMap[styleAbbr as keyof typeof abbrMap] || styleAbbr;

    if (isVar) {
      // runtime variable => var(--xxx)
      const finalVarName = `--${styleAbbr}-${keyframeName}-${blockLabel.replace('%', '')}`;
      // e.g. background-color: var(--bg-myKeyframe-50);
      cssText += `${finalProp}:var(${finalVarName});`;

      varMap[styleAbbr] = finalVarName;
      defaultVars[finalVarName] = propVal;
    } else {
      // กรณีปกติ => background-color: red;
      cssText += `${finalProp}:${propVal};`;
    }
  }

  return { cssText, varMap, defaultVars };
}

function parseKeyframeString(keyframeName: string, rawStr: string): string {
  // เช่น  "0%(bg[red]) 50%($bg[black]) 100%(bg[red])"
  const regex = /(\b(?:\d+%|from|to))\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  const blocks: Array<{ label: string; css: string }> = [];
  const defaultVarMap: Record<string, string> = {};

  while ((match = regex.exec(rawStr)) !== null) {
    const label = match[1]; // e.g. "0%", "50%", "100%"
    const abbrBody = match[2]; // e.g. "bg[red]" or "$bg[black]" etc.

    const { cssText, varMap, defaultVars } = parseKeyframeAbbr(
      abbrBody.trim(),
      keyframeName,
      label
    );
    blocks.push({ label, css: cssText });
    Object.assign(defaultVarMap, defaultVars);
  }

  let rootVarsBlock = '';
  for (const varName in defaultVarMap) {
    rootVarsBlock += `${varName}:${defaultVarMap[varName]};`;
  }

  let finalCss = '';
  if (rootVarsBlock) {
    finalCss += `:root{${rootVarsBlock}}`;
  }

  let body = '';
  for (const b of blocks) {
    body += `${b.label}{${b.css}}`;
  }
  finalCss += `@keyframes ${keyframeName}{${body}}`;

  return finalCss;
}

function generateVariableCSS(variableMap: Record<string, string>): string {
  // สร้าง :root { --xxx: yyy; ... }
  let rootBlock = '';
  for (const key in variableMap) {
    rootBlock += `--${key}:${variableMap[key]};`;
  }
  return rootBlock ? `:root{${rootBlock}}` : '';
}
// ---------------------------------------------------------------

/* ----------------------------------------------------------------------------------
   2) ฟังก์ชัน parseSwdThemeSource: ดึงข้อมูล palette, keyframe, variable 
      จาก sourceText (ไฟล์ styledwind.theme.ts) ด้วย Regex/Manual parse (แบบง่าย ๆ)
---------------------------------------------------------------------------------- */
interface IParseResult {
  palette: string[][] | null;
  variable: Record<string, string>;
  keyframe: Record<string, string>;
  // จะเพิ่มเติม breakpoint, typography, define ฯลฯ ได้หากต้องการ
}

function parseSwdThemeSource(sourceText: string): IParseResult {
  const result: IParseResult = {
    palette: null,
    variable: {},
    keyframe: {},
  };

  // 2.1) จับ theme.palette([...])
  //    หารูปแบบ theme.palette(
  //    แล้วจับเนื้อหาข้างในวงเล็บ โดยใช้ regex แบบคร่าว ๆ
  const paletteRegex = /theme\.palette\s*\(\s*\[([\s\S]*?)\]\s*\)/;
  const paletteMatch = paletteRegex.exec(sourceText);
  if (paletteMatch) {
    // paletteMatch[1] คือ string ด้านใน [ ... ]
    // เช่น:
    //  "['dark','light','dim'],
    //   ['blue-100','#3f1818','#BBDEFB','#90CAF9'],
    //   ..."

    const bracketContent = paletteMatch[1].trim();
    // Convert ' => "
    const bracketJson = bracketContent.replace(/'/g, '"');

    let finalJsonStr = `[${bracketJson}]`;
    // ลบ trailing commas
    finalJsonStr = finalJsonStr.replace(/,\s*\]/g, ']');

    try {
      const arr = JSON.parse(finalJsonStr);
      if (Array.isArray(arr)) {
        result.palette = arr;
      }
    } catch (err) {
      console.error('Parse palette error:', err);
    }
  }

  // 2.2) จับ theme.variable({ ... })
  const varRegex = /theme\.variable\s*\(\s*\{\s*([\s\S]*?)\}\s*\)/;
  const varMatch = varRegex.exec(sourceText);
  if (varMatch) {
    const varBody = varMatch[1].trim().replace(/\n/g, ' ');
    const kvRegex = /['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = kvRegex.exec(varBody)) !== null) {
      const k = m[1];
      const v = m[2];
      result.variable[k] = v;
    }
  }

  // 2.3) จับ theme.keyframe({ ... })
  const keyframeRegex = /theme\.keyframe\s*\(\s*\{\s*([\s\S]*?)\}\s*\)/;
  const keyframeMatch = keyframeRegex.exec(sourceText);
  if (keyframeMatch) {
    const kfBody = keyframeMatch[1];
    // จับคู่รูปแบบ (ชื่อ keyframe) : backtick-string หรือ singlequote-string
    const itemRegex = /(['"]?)([\w-]+)\1\s*:\s*(`([\s\S]*?)`|['"]([\s\S]*?)['"])/g;
    let km: RegExpExecArray | null;
    while ((km = itemRegex.exec(kfBody)) !== null) {
      const kName = km[2];
      const contentBacktick = km[4];
      const contentQuote = km[5];
      const rawContent = contentBacktick || contentQuote || '';
      const finalContent = rawContent.trim();
      result.keyframe[kName] = finalContent;
    }
  }

  return result;
}

/* ----------------------------------------------------------------------------------
   3) ฟังก์ชัน generateSwdThemeCssFromSource: 
      - parseSwdThemeSource => ได้ palette, keyframe, variable
      - สร้าง CSS ด้วย generatePaletteCSS, parseKeyframeString, generateVariableCSS
---------------------------------------------------------------------------------- */
function generateSwdThemeCssFromSource(sourceText: string): string {
  const parsed = parseSwdThemeSource(sourceText);

  let css = '';
  // 3.1) palette
  if (parsed.palette) {
    css += generatePaletteCSS(parsed.palette);
  }
  // 3.2) variable => :root{ --xxx:val; }
  if (Object.keys(parsed.variable).length > 0) {
    css += generateVariableCSS(parsed.variable);
  }
  // 3.3) keyframe => รวมทุกตัว
  for (const kName in parsed.keyframe) {
    css += parseKeyframeString(kName, parsed.keyframe[kName]);
  }

  return css;
}

/* ----------------------------------------------------------------------------------
   4) ฟังก์ชันหลัก createSwdThemeCssFile:
      - ตรวจไฟล์ชื่อ styledwind.theme.ts
      - แทรก import './styledwind.theme.css'
      - เรียก generateSwdThemeCssFromSource
      - เขียนไฟล์ .css
---------------------------------------------------------------------------------- */
export async function createSwdThemeCssFile(doc: vscode.TextDocument) {
  // 4.1) ตรวจว่าเป็นไฟล์ styledwind.theme.ts
  if (!doc.fileName.endsWith('styledwind.theme.ts')) {
    return;
  }

  // 4.2) สร้าง path ของ .css
  const fileName = path.basename(doc.fileName); // e.g. styledwind.theme.ts
  const baseName = fileName.replace(/\.ts$/, ''); // e.g. styledwind.theme
  const currentDir = path.dirname(doc.fileName);
  const newCssFilePath = path.join(currentDir, baseName + '.css');
  // => ./styledwind.theme.css

  // 4.3) ถ้ายังไม่มีไฟล์ => สร้างเปล่า
  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 4.4) แทรก import './styledwind.theme.css'
  const relImport = `./${baseName}.css`;
  const importLine = `import '${relImport}';\n`;

  const fullText = doc.getText();
  // ลบ import เก่า (ถ้ามี)
  const oldRegex = new RegExp(`^import\\s+["'][^"']*${baseName}\\.css["'];?\\s*(?:\\r?\\n)?`, 'm');
  let newText = fullText.replace(oldRegex, '');
  // ลบช่องว่างซ้ำ
  newText = newText.replace(/\n{2,}/g, '\n');
  // เพิ่ม import ใหม่
  const finalText = importLine + newText;

  // apply แก้ไข text editor
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);
  await vscode.workspace.applyEdit(edit);

  // 4.5) generate CSS
  let generatedCss: string;
  try {
    // ตัด importLine ออกก่อนค่อยส่งไป parse
    generatedCss = generateSwdThemeCssFromSource(finalText.replace(importLine, ''));
  } catch (err) {
    vscode.window.showErrorMessage(`Styledwind theme parse error: ${(err as Error).message}`);
    throw err;
  }

  // 4.6) เขียนไฟล์ .css
  fs.writeFileSync(newCssFilePath, generatedCss, 'utf8');

  // (ออปชัน) แจ้งเตือน
  // vscode.window.showInformationMessage(`Created/Updated ${baseName}.css successfully!`);
}
