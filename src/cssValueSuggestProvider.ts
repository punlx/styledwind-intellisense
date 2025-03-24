// suggestProviders.ts
import * as vscode from 'vscode';
import { abbrMap, cssValues } from './constants';

/**
 * createBracketProvider:
 *  จับ pattern (\w+)\[$ => เช่น bg[ => แสดง cssValues ที่กำหนดใน constants.ts
 */
export function createCSSValueSuggestProvider() {
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
        const match = /([\w-]+)\[$/.exec(textBeforeCursor);
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
