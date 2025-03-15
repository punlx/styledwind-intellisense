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

        // จับ pattern (\w+)\[.*?--$ => เช่น bg[--, c[-- เพื่อเช็คว่ากำลังพิมพ์ "--"
        const match = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!match) {
          return;
        }

        // 1) ตรวจว่ามี comment // styledwind intellisense (mode: xxx) หรือไม่
        let mode: string | undefined;
        const docText = document.getText();
        const modeRegex = /\/\/\s*styledwind intellisense\s*\(mode:\s*(\w+)\)/;
        const modeMatch = modeRegex.exec(docText);
        if (modeMatch) {
          mode = modeMatch[1]; // e.g. "dark"
        }

        // 2) สร้าง CompletionItem ให้ทุก colorName
        const completions: vscode.CompletionItem[] = [];

        for (const colorName of Object.keys(paletteMap)) {
          // สร้าง item แต่ละสี
          // ปกติเราจะ set kind = CompletionItemKind.Color เพื่อให้มีแถบ swatch
          // แต่ถ้าไม่มี mode -> ไม่ต้องโชว์เป็น swatch ให้โชว์เป็น "ไอคอน + ตัวหนังสือ" แทน
          let itemKind = vscode.CompletionItemKind.Color;
          let colorHex = '#CCCCCC';

          if (mode && paletteMap[colorName] && paletteMap[colorName][mode]) {
            // กรณีเจอโหมด -> ใช้สีจริง แสดง swatch
            colorHex = paletteMap[colorName][mode];
            itemKind = vscode.CompletionItemKind.Color;
          } else {
            // กรณีไม่เจอ comment mode -> ไม่ต้องโชว์ swatch
            // ใช้ itemKind อย่างอื่น และใส่ไอคอน $(paintcan) ไว้ใน label แทน
            itemKind = vscode.CompletionItemKind.Color;
          }

          // ตั้ง label, insertText ตามต้องการ
          const item = new vscode.CompletionItem(colorName, itemKind);
          item.insertText = colorName;

          // ถ้าไม่มี mode -> prefix ไอคอนจานสีใน label
          if (!mode) {
            item.label = colorName;
            // จะไม่เซ็ต detail เป็น HEX เพื่อไม่ให้ VSCode โชว์ swatch
            // (VSCode บางรุ่นจะพยายาม render color swatch ถ้า detail เป็นสี)
          } else {
            // มี mode -> เป็น swatch ได้
            // แสดงค่าตัวจริงใน detail (VSCode จะทำเป็น square color)
            item.detail = colorHex;
            // ใส่ doc เพิ่มเพื่อบอกสีนี้เป็นของ mode ไหน
            item.documentation = new vscode.MarkdownString(
              `**Color name**: \`${colorName}\`  \n` +
                `**Mode**: \`${mode}\`  \n` +
                `**Hex**: \`${colorHex}\``
            );
          }

          completions.push(item);
        }

        return completions;
      },
    },
    '-' // trigger character
  );
}
export function createDashProvider2(paletteColors: string[]) {
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

        const match = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!match) return;
        if (!paletteColors.length) return;

        return paletteColors.map((colorVar) => {
          const item = new vscode.CompletionItem(colorVar, vscode.CompletionItemKind.Color);
          item.detail = 'Color from styledwind.theme.ts';
          item.insertText = colorVar;

          // ทับ "--" สองตัวท้าย
          const replaceStart = position.translate(0, -2);
          const replaceRange = new vscode.Range(replaceStart, position);
          item.range = replaceRange;

          return item;
        });
      },
    },
    '-'
  );
}
