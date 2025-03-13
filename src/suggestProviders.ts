// suggestProviders.ts

import * as vscode from 'vscode';
import { abbrMap, cssValues } from './constants';

/**
 * createBracketProvider:
 *  จับ pattern (\w+)\[$ => เช่น bg[ => แสดง cssValues ที่กำหนดใน constants.ts
 */
export function createBracketProvider() {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) return;

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // จับชื่อ abbr ก่อนเครื่องหมาย [
        // เช่น "bg["
        const match = /(\w+)\[$/.exec(textBeforeCursor);
        if (!match) return;

        const ab = match[1];
        const cssProp = abbrMap[ab];
        if (!cssProp) return;

        const possibleValues = cssValues[cssProp] || [];
        if (!possibleValues.length) return;

        // สร้างรายการ Suggest values
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
}

/**
 * createDashProvider:
 *  - เดิมที รับ paletteColors: string[] (เช่น ["--blue-100","--blue-200",...])
 *    แต่ตอนนี้เปลี่ยนเป็นรับ paletteMap: Record<string, Record<string,string>>
 *    ซึ่งจะมาจาก parseThemePaletteFull() เช่น
 *    {
 *      "blue-100": { dark: "#E3F2FD", light: "#BBDEFB", dim: "#90CAF9" },
 *      "blue-200": { dark: "#64B5F6", light: "#42A5F5", dim: "#2196F3" },
 *      ...
 *    }
 *
 *  - เวลาพิมพ์ `--` ในไฟล์ .css.ts -> Suggest รายการสี
 *    * ถ้าพบคอมเมนต์ // styledwind intellisense (mode: dark)
 *      => แสดง swatch (CompletionItemKind.Color) เป็นสีของคอลัมน์ dark
 *    * Label แสดงเป็น "blue-100" (ไม่มี --)
 *    * insertText เป็น "--blue-100"
 */
export function createDashProvider(paletteMap: Record<string, Record<string, string>>) {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // เงื่อนไข: เฉพาะไฟล์ *.css.ts
        if (!document.fileName.endsWith('.css.ts')) return;

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // จับ pattern (\w+)\[.*?--$ => เช่น bg[--, c[--, เพื่อตรวจว่ากำลังพิมพ์ "--"
        const match = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!match) {
          return;
        }

        // 1) Parse คอมเมนต์ในไฟล์ .css.ts => หา mode
        //   เช่น // styledwind intellisense (mode: dark)
        const docText = document.getText();
        let mode: string | undefined;
        const modeRegex = /\/\/\s*styledwind intellisense\s*\(mode:\s*(\w+)\)/;
        const modeMatch = modeRegex.exec(docText);
        if (modeMatch) {
          mode = modeMatch[1]; // e.g. "dark"
        }

        // 2) ถ้าไม่มี mode ไม่ต้องการแสดง swatch (จะไม่ขึ้นเป็นสี)
        //    เราจะไม่ใช้ CompletionItemKind.Color เพื่อไม่ให้เกิด swatch
        const itemKindWhenNoMode = vscode.CompletionItemKind.Value;
        // หรือถ้าต้องการ “ไม่โชว์ suggestion เลย” ให้ return ทันที
        // if (!mode) return;

        // สร้าง CompletionItem สำหรับแต่ละ "colorName" ใน paletteMap
        const completions: vscode.CompletionItem[] = [];

        for (const colorName of Object.keys(paletteMap)) {
          // colorName: "blue-100"
          // สร้าง CompletionItem
          // ถ้าพบ mode => ใช้เป็น Color เพื่อให้มี swatch
          // ถ้าไม่พบ mode => ใช้ Value/Variable แทน เพื่อ “ไม่ให้” แสดง swatch
          const itemKind = mode ? vscode.CompletionItemKind.Color : itemKindWhenNoMode;

          const item = new vscode.CompletionItem(colorName, itemKind);
          // เวลา user กดเลือก -> แทรก "--blue-100"
          item.insertText = `${colorName}`;

          // ถ้ามี mode จึงค่อยแสดงสีจริง ๆ
          // ถ้าไม่มี mode จะเป็น #CCCCCC หรือจะไม่ใส่ detail เลยก็ได้
          let colorHex = '#CCCCCC';
          if (mode && paletteMap[colorName] && paletteMap[colorName][mode]) {
            colorHex = paletteMap[colorName][mode];
          }

          // detail/documentation
          item.detail = mode ? colorHex : `No mode found, swatch disabled`;

          // จะใส่ doc เพิ่มหรือไม่ก็ได้
          item.documentation = new vscode.MarkdownString(
            `**Color name**: \`${colorName}\`\n\n` +
              `**Mode**: \`${mode || '-'}\`\n\n` +
              `**Hex**: \`${colorHex}\``
          );

          completions.push(item);
        }

        return completions;
      },
    },
    '-' // trigger character
  );
}
