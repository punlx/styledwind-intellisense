import * as vscode from 'vscode';
import { colorAbbrSet } from './constants';

/**
 * createColorProvider:
 * - Trigger เมื่อเห็น "--" ใน abbr[...] (ex. "bg[--", "c[--", "bd[--")
 * - เช็คว่า ab in colorAbbrSet หรือไม่
 * - ถ้าใช่ => Suggest color list (จาก paletteMap)
 * - เลือก HEX ตาม mode ที่ผู้ใช้กำหนดในคอมเมนต์ (ex. // styledwind intellisense (mode: dark))
 * - item.detail = HEX => VSCode แสดง swatch, item.documentation = list ทุก mode
 */
export function createColorProvider(paletteMap: Record<string, Record<string, string>>) {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // 1) ตรวจว่าต้องเป็นไฟล์ .css.ts เท่านั้น
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        // 2) อ่านบรรทัดก่อน Cursor เพื่อจับ abbr[.*--$
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // 3) อ่านทั้งไฟล์เพื่อหา comment mode
        const docText = document.getText();
        const modeRegex = /\/\/\s*styledwind intellisense\s*\(mode:\s*(\w+)\)/;
        const modeMatch = modeRegex.exec(docText);
        let mode: string | undefined;
        if (modeMatch) {
          mode = modeMatch[1]; // ex. 'dark'
        }

        // 4) จับ pattern abbr + [... --$
        const regex = /([\w-]+)\[.*?--$/;
        const match = regex.exec(textBeforeCursor);
        if (!match) {
          return;
        }

        const ab = match[1]; // เช่น "bg", "c"
        // 5) เช็ค ab in colorAbbrSet ไหม
        if (!colorAbbrSet.has(ab)) {
          return;
        }

        // 6) สร้าง Suggestion จาก paletteMap
        const completions: vscode.CompletionItem[] = [];

        for (const colorName of Object.keys(paletteMap)) {
          // paletteMap[colorName] ex. { dark: "#E3F2FD", light: "#BBDEFB", ... }
          const modeKeys = Object.keys(paletteMap[colorName]);
          let colorHex = '#CCCCCC';

          // ถ้ามี mode และค่าใน paletteMap[colorName][mode] => เอาค่าสีนั้น
          if (mode && paletteMap[colorName][mode]) {
            colorHex = paletteMap[colorName][mode];
          } else {
            // fallback: ถ้ามี key อื่นอยู่ เอาคีย์แรก
            if (modeKeys.length > 0) {
              colorHex = paletteMap[colorName][modeKeys[0]];
            }
          }

          // สร้าง CompletionItem
          const item = new vscode.CompletionItem(colorName, vscode.CompletionItemKind.Color);
          // detail => ให้เป็น HEX เพื่อให้ VSCode แสดง swatch สี
          item.detail = colorHex;

          // documentation => แสดงทุก mode ของ color นี้
          let docText = `**Color name**: ${colorName}\n\n`;
          for (const mk of modeKeys) {
            docText += `- ${mk}: ${paletteMap[colorName][mk]}\n`;
          }
          item.documentation = new vscode.MarkdownString(docText);

          // เมื่อเลือก => พิมพ์ colorName
          item.insertText = colorName;

          completions.push(item);
        }

        return completions;
      },
    },
    '-' // trigger character
  );
}
