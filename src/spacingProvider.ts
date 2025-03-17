import * as vscode from 'vscode';
import { spacingAbbrSet } from './constants';

/**
 * createSpacingProvider:
 * - Trigger เมื่อผู้ใช้พิมพ์ "--" ใน .css.ts
 * - จับ abbr[...] -- (เช่น "mt[--"), แล้วดูว่า abbr in spacingAbbrSet ไหม
 * - ถ้าใช่ => Suggest spacing name (e.g. "spacing-1","spacing-2"...) พร้อม detail/doc
 */

export function createSpacingProvider(spacingDict: Record<string, string>) {
  return vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) {
          return;
        }

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // จับ pattern (\w+)\[.*?--$
        // เช่น "mt[--"
        const regex = /([\w-]+)\[.*?--$/;
        const match = regex.exec(textBeforeCursor);
        if (!match) {
          return;
        }

        const ab = match[1]; // e.g. "mt"

        // เช็คว่า ab อยู่ใน spacingAbbrSet ไหม
        if (!spacingAbbrSet.has(ab)) {
          // ถ้าไม่ -> ไม่ต้อง suggest spacing
          return;
        }

        // ถ้าใช่ -> Suggest spacing name list จาก spacingDict
        const completions: vscode.CompletionItem[] = [];

        for (const spacingName of Object.keys(spacingDict)) {
          const spacingValue = spacingDict[spacingName]; // ex. '12px'

          const item = new vscode.CompletionItem(spacingName, vscode.CompletionItemKind.Value);
          item.detail = spacingName; // เช่น "spacing-1"
          item.documentation = spacingValue; // เช่น "12px"

          // insertText = "spacing-1" หรืออะไรก็ว่าไป
          item.insertText = spacingName;

          completions.push(item);
        }

        return completions;
      },
    },
    '-' // trigger character
  );
}
