// directiveProvider.ts
import * as vscode from 'vscode';

export function createDirectiveProvider() {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        // 1) เฉพาะไฟล์ .css.ts
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        // 2) ข้อความก่อน cursor (เฉพาะบรรทัดนี้)
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // 3) เช็กว่าเพิ่งพิมพ์ "@" หรือไม่
        if (!textBeforeCursor.endsWith('@')) {
          return;
        }

        // 4) ตรวจว่า position ตอนนี้อยู่ใน block ของ .xxx { ... } หรือไม่
        const isInsideClassBlock = checkIfInsideClassBlock(document, position);

        // 5) สร้าง Completion Items ตามเงื่อนไข
        const completions: vscode.CompletionItem[] = [];

        if (isInsideClassBlock) {
          // อยู่ใน .box { ... } => แสดงเฉพาะ "@use"
          const useItem = new vscode.CompletionItem('use', vscode.CompletionItemKind.Keyword);
          useItem.insertText = 'use';
          useItem.detail = 'styledwind directive (@use) inside class';

          const queryItem = new vscode.CompletionItem('query', vscode.CompletionItemKind.Keyword);
          queryItem.insertText = 'query';
          queryItem.detail = 'styledwind directive (@query) inside class';
          completions.push(useItem, queryItem);
        } else {
          // อยู่นอกบล็อก => แสดง @scope, @bind, @const
          const scopeItem = new vscode.CompletionItem('scope', vscode.CompletionItemKind.Keyword);
          scopeItem.insertText = 'scope';
          scopeItem.detail = 'styledwind Scope directive';
          completions.push(scopeItem);

          const bindItem = new vscode.CompletionItem('bind', vscode.CompletionItemKind.Keyword);
          bindItem.insertText = 'bind';
          bindItem.detail = 'styledwind Bind directive';
          completions.push(bindItem);

          const constItem = new vscode.CompletionItem('const', vscode.CompletionItemKind.Keyword);
          constItem.insertText = 'const';
          constItem.detail = 'styledwind Abbe Constant directive';
          completions.push(constItem);
        }

        return completions;
      },
    },
    '@' // trigger character
  );
}

/**
 * ฟังก์ชันช่วย: ตรวจสอบว่า Cursor อยู่ภายใน .xxx { ... } หรือไม่
 * แนวทางง่าย ๆ: วิ่งตั้งแต่เริ่มไฟล์ถึงตำแหน่ง cursor แล้วนับเปิด-ปิดปีกกาที่ match กับ .xxx {
 */
function checkIfInsideClassBlock(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  // ดึงข้อความตั้งแต่บรรทัดแรกจนถึงตำแหน่งปัจจุบัน
  const fullRange = new vscode.Range(new vscode.Position(0, 0), position);
  const textUpToCursor = document.getText(fullRange);

  // เราจะ parse เพื่อหา ".xxx {" แล้ว +1 stack, เจอ "}" -1 stack
  // ถ้า stack > 0 แปลว่ายังไม่ปิด block -> เราอยู่ใน block
  let stack = 0;

  // แนวทาง Regex หาบล็อก class (simple)
  //   ใช้ /(\.\w+\s*\{)|(\})/g  => group1 คือเปิด .xxx {, group2 คือปิด }
  const regex = /(\.\w+\s*\{)|(\})/g;
  let match;
  while ((match = regex.exec(textUpToCursor)) !== null) {
    if (match[1]) {
      // เจอ .xxx {
      stack++;
    } else if (match[2]) {
      // เจอ }
      if (stack > 0) {
        stack--;
      }
    }
  }

  return stack > 0;
}
