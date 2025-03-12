// suggestProviders.ts
import * as vscode from 'vscode';
import { abbrMap, cssValues } from './constants';

/** createBracketProvider:
 * จับ pattern (\w+)\[$ => เช่น bg[ => แสดง cssValues
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

        const match = /(\w+)\[$/.exec(textBeforeCursor);
        if (!match) return;

        const ab = match[1];
        const cssProp = abbrMap[ab];
        if (!cssProp) return;

        const possibleValues = cssValues[cssProp] || [];
        if (!possibleValues.length) return;

        return possibleValues.map((val) => {
          const item = new vscode.CompletionItem(val, vscode.CompletionItemKind.Value);
          item.detail = `CSS value for ${cssProp}`;
          item.insertText = val;
          return item;
        });
      },
    },
    '['
  );
}

/** createDashProvider:
 * จับ pattern (\w+)\[.*?--$ => เพื่อ suggest paletteColors
 */
export function createDashProvider(paletteColors: string[]) {
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
