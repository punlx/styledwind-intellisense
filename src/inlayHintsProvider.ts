// inlayHintsProvider.ts
import * as vscode from 'vscode';
import { abbrMap } from './constants'; // ใช้ abbrMap จาก constants.ts

export function createInlayHintsProvider() {
  return vscode.languages.registerInlayHintsProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideInlayHints(document, range, token) {
        const allHints: vscode.InlayHint[] = [];

        for (let lineIndex = range.start.line; lineIndex <= range.end.line; lineIndex++) {
          const lineText = document.lineAt(lineIndex).text;
          const regex = /([\w-]+)\[/g;
          let match: RegExpExecArray | null;

          // regex จับ abbr เช่น "bg[" => abbr="bg"
          while ((match = regex.exec(lineText)) !== null) {
            const abbr = match[1];
            const startIndex = match.index;

            // ถ้า abbr อยู่ใน abbrMap => สร้าง inlay hints
            if (abbr in abbrMap) {
              // เช่น 'bg' => 'background-color'
              const propFullName = abbrMap[abbr];
              // ตำแหน่งท้าย abbr
              const position = new vscode.Position(lineIndex, startIndex + abbr.length);

              const hint = new vscode.InlayHint(
                position,
                `${propFullName}` // แสดง "background-color"
              );
              hint.kind = vscode.InlayHintKind.Type;
              hint.paddingLeft = true;

              allHints.push(hint);
            }
          }
        }

        return allHints;
      },
    }
  );
}
