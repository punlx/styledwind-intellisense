// directiveProvider.ts
import * as vscode from 'vscode';

export function createDirectiveProvider() {
  return vscode.languages.registerCompletionItemProvider(
    // ใช้กับ TypeScript/TSX เท่านั้นตามที่โปรเจกต์ทำอยู่
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

        // 2) ข้อความก่อน cursor
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // 3) เช็กว่าเพิ่งพิมพ์ "@" หรือไม่
        if (!textBeforeCursor.endsWith('@')) {
          return;
        }

        // 4) สร้าง Completion Items
        const completions: vscode.CompletionItem[] = [];

        // ตัวอย่าง: Suggest "scope "
        {
          const item = new vscode.CompletionItem('scope ', vscode.CompletionItemKind.Keyword);
          // insertText = "scope " เพื่อให้พิมพ์ตามหลัง '@'
          // (แล้วแต่ต้องการว่าจะมีเคาะว่างต่อท้ายหรือไม่)
          item.insertText = 'scope ';
          item.detail = 'styledwind directive';
          completions.push(item);
        }

        // ตัวอย่าง: Suggest "bind"
        {
          const item = new vscode.CompletionItem('bind', vscode.CompletionItemKind.Keyword);
          item.insertText = 'bind ';
          item.detail = 'styledwind directive';
          completions.push(item);
        }

        return completions;
      },
    },
    '@' // trigger character
  );
}
