import * as vscode from 'vscode';
import * as fs from 'fs';
import { abbrMap, cssValues } from './constants';

/**
 * ฟังก์ชัน parseThemePaletteFile:
 * รับ path ของไฟล์ theme, แล้วดึง array ชื่อสีในคอลัมน์แรก
 * โดยข้ามแถวแรก (dark, light, dim) แล้ว return ["--blue-100", "--blue-200", ...]
 */
function parseThemePaletteFile(themeFilePath: string): string[] {
  if (!fs.existsSync(themeFilePath)) {
    return [];
  }

  const content = fs.readFileSync(themeFilePath, 'utf8');
  // จับบริเวณ theme.palette([...]) ด้วย regex (แบบง่าย ๆ)
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) {
    return [];
  }

  const inside = match.groups.inside; // เนื้อหาในวงเล็บสี่เหลี่ยม [..., ...]

  // แยกตามบรรทัด
  const lines = inside.split('\n');
  const result: string[] = [];
  let skipFirstRow = true; // แถวแรกเป็น ['dark','light','dim'] => ข้าม

  for (let line of lines) {
    line = line.trim();
    if (!line.startsWith('[')) {
      // ไม่ใช่บรรทัดที่คาดหวัง
      continue;
    }

    if (skipFirstRow) {
      // เจอแถวแรก -> ข้าม
      skipFirstRow = false;
      continue;
    }

    // ตัวอย่าง line => "['blue-100', '#E3F2FD', '#BBDEFB', '#90CAF9'],"
    // ใช้ regex จับ 'blue-100'
    const rowMatch = /^\[\s*['"]([^'"]+)['"]/.exec(line);
    if (rowMatch) {
      const colorName = rowMatch[1];
      result.push(`--${colorName}`); // เติมขีดสองตัวเป็น var(--blue-100)
    }
  }

  return result;
}

/**
 * abbrMap: แผนที่ย่อ => CSS property
 */

/**
 * cssValues: property => list ค่าที่จะ Suggest
 * (กรณี border ไม่อยาก Suggest เป็น default แล้วก็ตัดทิ้งได้)
 */

/**
 * ฟังก์ชัน activate Extension
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // 1) ถ้าไม่มี workspaceFolders แปลว่า user ไม่ได้เปิดโฟลเดอร์ใด ๆ -> ข้ามได้
  if (!vscode.workspace.workspaceFolders?.length) {
    console.log('No workspace folder is open; cannot find theme file automatically.');
    return;
  }

  // 2) ค้นหาไฟล์ styledwind.theme.ts
  let paletteColors: string[] = [];
  try {
    const foundUris = await vscode.workspace.findFiles(
      '**/styledwind.theme.ts',
      '**/node_modules/**',
      1
    );
    if (foundUris.length > 0) {
      const themeFilePath = foundUris[0].fsPath;
      console.log('Found theme file:', themeFilePath);

      // 3) parse themeFile
      paletteColors = parseThemePaletteFile(themeFilePath);
      console.log('Parsed palette colors:', paletteColors);
    } else {
      console.log('No styledwind.theme.ts found in workspace.');
    }
  } catch (err) {
    console.error('Error searching or parsing styledwind.theme.ts:', err);
  }

  // ============== bracketProvider ==============
  const bracketProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // ให้ Suggest ทำงานเฉพาะไฟล์ .css.ts
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // หารูปแบบ abbr[ เช่น bg[ c[ jc[
        const match = /(\w+)\[$/.exec(textBeforeCursor);
        if (!match) return;

        const abbr = match[1];
        const cssProp = abbrMap[abbr];
        if (!cssProp) return;

        const possibleValues = cssValues[cssProp] || [];
        if (possibleValues.length === 0) return;

        return possibleValues.map((val) => {
          const item = new vscode.CompletionItem(val, vscode.CompletionItemKind.Value);
          item.detail = `CSS value for ${cssProp}`;
          item.insertText = val;
          return item;
        });
      },
    },
    '[' // trigger character
  );

  // ============== dashProvider ==============
  const dashProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // จับ pattern เช่น "bg[--", "bd[some 1px --", "c[--" ...
        const match = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!match) {
          return;
        }

        // ใช้ paletteColors ที่ parse มาได้จาก theme
        if (paletteColors.length === 0) {
          return;
        }

        // สร้าง CompletionItem สำหรับแต่ละสี
        return paletteColors.map((colorVar) => {
          const item = new vscode.CompletionItem(colorVar, vscode.CompletionItemKind.Color);
          item.detail = 'Color from styledwind.theme.ts';
          item.insertText = colorVar;

          // ระบุ range ให้ทับ "--" สองตัวท้าย
          const replaceStart = position.translate(0, -2);
          const replaceRange = new vscode.Range(replaceStart, position);
          item.range = replaceRange;

          return item;
        });
      },
    },
    '-' // trigger character
  );

  context.subscriptions.push(bracketProvider, dashProvider);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
