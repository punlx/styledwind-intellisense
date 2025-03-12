// reversePropertyProvider.ts
import * as vscode from 'vscode';
import { abbrMap } from './constants';

/**
 * เราสร้าง reverseMap จาก 'background-color' => 'bg', 'border' => 'bd', ฯลฯ
 * เพื่อให้เวลาผู้ใช้เลือก property แบบเต็ม จะ insert abbr ลงไปแทน
 */
const reverseMap: Record<string, string> = {};
(function buildReverseMap() {
  for (const abbr in abbrMap) {
    const propName = abbrMap[abbr];
    reverseMap[propName] = abbr;
  }
})();

/**
 * createReversePropertyProvider():
 * - Trigger: อาจให้ทำงานทุกครั้งที่ user พิมพ์ตัวอักษร (ไม่กำหนด trigger character เฉพาะ)
 * - ถ้าขึ้นอยู่กับ VSCode setting, user ต้องกด Ctrl+Space เพื่อเรียก suggest
 * - Logic: match prefix text => suggest property ที่ขึ้นต้นด้วย prefix
 * - insertText = abbr (เช่น user เลือก background-color => ได้ 'bg')
 */
export function createReversePropertyProvider() {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // เงื่อนไขว่าเฉพาะไฟล์ *.css.ts
        if (!document.fileName.endsWith('.css.ts')) return;

        // ข้อความก่อน cursor
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // แยก token สุดท้าย (เช่น user กำลังพิม 'back' => match property 'background-color')
        // ตัวอย่างง่าย ๆ: ใช้ regex เอา "word" ล่าสุด
        const wordMatch = /([\w-]+)$/.exec(textBeforeCursor);
        if (!wordMatch) return;

        const prefix = wordMatch[1]; // e.g. "b" หรือ "bac" หรือ "backg"
        if (!prefix) return;

        // หา property name (ตัวเต็ม) ที่ขึ้นต้นด้วย prefix
        // ถ้าคุณอยากทำ fuzzy match ก็ประยุกต์
        const matchingProps = Object.keys(reverseMap).filter((propName) =>
          propName.startsWith(prefix)
        );
        if (!matchingProps.length) return;

        // สร้าง CompletionItems
        return matchingProps.map((propName) => {
          const abbr = reverseMap[propName]; // e.g. background-color => bg
          const item = new vscode.CompletionItem(propName, vscode.CompletionItemKind.Property);
          item.detail = `Styledwind: abbr => ${abbr}`;
          // แทรก abbr ลงไปแทน prefix
          // โดยต้องแทน prefix เดิม (เช่น "backgr" 6 ตัวอักษร)
          const replaceRange = new vscode.Range(
            position.line,
            position.character - prefix.length, // เริ่มตั้งแต่ prefix
            position.line,
            position.character
          );
          item.range = replaceRange;

          // set insertText
          item.insertText = abbr;
          return item;
        });
      },
    }
  );
}
