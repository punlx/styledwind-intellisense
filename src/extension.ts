import * as vscode from 'vscode';

const abbrMap: Record<string, string> = {
  c: 'color',
  bg: 'background-color',
  jc: 'justify-content',
  ai: 'align-items',
  bd: 'border',
};

// border: ... ถูกเอาออก
const cssValues: Record<string, string[]> = {
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch'],
  'background-color': ['red', 'blue', 'green', 'white', 'black'],
  color: ['red', 'blue', 'green', 'white', 'black'],
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // 1) bracketProvider
  const bracketProvider = vscode.languages.registerCompletionItemProvider(
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

        const abbr = match[1];
        const cssProp = abbrMap[abbr];
        if (!cssProp) return;

        const possibleValues = cssValues[cssProp] || [];
        if (!possibleValues.length) return undefined;

        const items = possibleValues.map((val) => {
          const item = new vscode.CompletionItem(val, vscode.CompletionItemKind.Value);
          item.detail = `CSS value for ${cssProp}`;
          item.insertText = val;
          return item;
        });

        return items;
      },
    },
    '['
  );

  // 2) dashProvider
  const dashProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) {
          return undefined;
        }

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // จับ pattern มี abbr[...-- ( เช่น bd[1px solid -- )
        const match = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!match) {
          return undefined;
        }

        const paletteColors = ['--blue-100', '--blue-200', '--blue-300'];
        const items: vscode.CompletionItem[] = [];

        for (const colorVar of paletteColors) {
          const item = new vscode.CompletionItem(colorVar, vscode.CompletionItemKind.Color);
          item.detail = 'CSS variable from theme palette';
          item.insertText = colorVar;

          // ครอบ 2 ขีดสุดท้าย => replace ด้วย --blue-xxx
          const replaceStart = position.translate(0, -2);
          const replaceRange = new vscode.Range(replaceStart, position);
          item.range = replaceRange;

          items.push(item);
        }
        return items;
      },
    },
    '-' // trigger
  );

  context.subscriptions.push(bracketProvider, dashProvider);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
