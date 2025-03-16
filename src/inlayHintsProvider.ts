import * as vscode from 'vscode';
import { abbrMap } from './constants';
import { specialSplitMap } from './specialSplitMap'; // ที่เราเพิ่ง generate

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

          while ((match = regex.exec(lineText)) !== null) {
            const abbr = match[1];
            const startIndex = match.index;

            // ถ้า abbr ไม่อยู่ใน abbrMap => ข้าม
            if (!abbrMap[abbr]) continue;

            // หาชุด split
            const splits = specialSplitMap[abbr];
            if (!splits) {
              // fallback => ไม่ split, หรือจะแสดง property เต็มก็ได้
              continue;
            }

            // คำนวณ inlay
            const abbrLength = abbr.length;
            for (const split of splits) {
              if (split.pos <= abbrLength) {
                const pos = new vscode.Position(lineIndex, startIndex + split.pos);
                const hint = new vscode.InlayHint(pos, split.text);
                hint.kind = vscode.InlayHintKind.Type;
                hint.paddingLeft = true;
                allHints.push(hint);
              }
            }
          }
        }

        return allHints;
      },
    }
  );
}
