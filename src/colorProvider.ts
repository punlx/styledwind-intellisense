import * as vscode from 'vscode';
import { colorAbbrSet } from './constants';

/**
 * createColorProvider:
 * - Trigger เมื่อเจอ "--" หลัง abbr[...] เช่น "bg[--", "c[--"
 * - ถ้า ab in colorAbbrSet => Suggest color name จาก paletteMap
 * - ถ้าเจอคอมเมนต์ // styledwind intellisense (mode: dark) => ใช้สีจริง + swatch
 * - ถ้าไม่มี mode => แสดง icon color (ไม่มี swatch), label = colorName
 */
export function createColorProvider(paletteMap: Record<string, Record<string, string>>) {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // 1) ไฟล์ .css.ts เท่านั้น
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        // 2) อ่านข้อความก่อน cursor เพื่อตรวจ pattern (\w+)\[.*?--$
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // 3) หาว่ามี comment mode ไหม (// styledwind intellisense (mode: X))
        const docText = document.getText();
        const modeRegex = /\/\/\s*styledwind intellisense\s*\(mode:\s*(\w+)\)/;
        const modeMatch = modeRegex.exec(docText);
        let mode: string | undefined;
        if (modeMatch) {
          mode = modeMatch[1]; // ex. "dark"
        }

        // 4) จับ ab: เช่น "bg[--"
        const abMatch = /([\w-]+)\[.*?--$/.exec(textBeforeCursor);
        if (!abMatch) {
          return;
        }

        const ab = abMatch[1];
        // ถ้า ab นี้ไม่ใช่ colorAbbrSet => ไม่ suggestion
        if (!colorAbbrSet.has(ab)) {
          return;
        }

        // 5) สร้าง CompletionItem จากแต่ละ colorName ใน paletteMap
        const completions: vscode.CompletionItem[] = [];

        for (const colorName of Object.keys(paletteMap)) {
          // ตัวอย่าง paletteMap[colorName] = { dark:"#...", light:"#...", ... }
          let itemKind = vscode.CompletionItemKind.Color;
          let colorHex = '#CCCCCC';

          // ถ้าเจอโหมด => เอาสีนั้นมาโชว์ swatch
          if (mode && paletteMap[colorName][mode]) {
            colorHex = paletteMap[colorName][mode];
          } else {
            // fallback: ถ้ามีคีย์อื่น
            const allModes = Object.keys(paletteMap[colorName]);
            if (allModes.length > 0) {
              colorHex = paletteMap[colorName][allModes[0]];
            }
          }

          // สร้าง completion item
          const item = new vscode.CompletionItem(colorName, itemKind);

          if (!mode) {
            // กรณีไม่มี mode => label = colorName, ไม่ set detail=HEX => VSCode ไม่ render swatch
            item.label = colorName;
            // ใส่ doc เล็กน้อย
            item.documentation = new vscode.MarkdownString(
              `No color mode specified.\n\nColor name: \`${colorName}\``
            );
          } else {
            // มี mode => แสดง swatch ได้
            item.detail = colorHex;
            // documentation แสดงข้อมูล mode + hex
            let docText = `**Color name**: \`${colorName}\`\n**Mode**: \`${mode}\`\n**Hex**: \`${colorHex}\`\n\nAll modes:\n`;
            for (const mk of Object.keys(paletteMap[colorName])) {
              docText += `- ${mk}: ${paletteMap[colorName][mk]}\n`;
            }
            item.documentation = new vscode.MarkdownString(docText);
          }

          // ใส่ insertText = colorName (ผู้ใช้กดเลือกแล้วจะพิมพ์ "blue-100" ฯลฯ)
          item.insertText = colorName;

          completions.push(item);
        }

        return completions;
      },
    },
    '-' // trigger character
  );
}
