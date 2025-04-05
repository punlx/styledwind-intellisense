// src/generateCssCommand/parsers/parseDirectives.ts

import { createEmptyStyleDef } from '../helpers/createEmptyStyleDef';
import { parseClassBlocksWithBraceCounting } from '../helpers/parseClassBlocksWithBraceCounting';
import { IClassBlock, IConstBlock, IParsedDirective } from '../types';
import { parseSingleAbbr } from './parseSingleAbbr';

/* -------------------------------------------------------------------------
   Section H: parseDirectives(text)
   - หา @const name {...}
   - หา directive top-level (@scope, @bind) ยกเว้น @use, @query
   - parse .className { ... }
   ------------------------------------------------------------------------- */
export function parseDirectives(text: string): {
  directives: IParsedDirective[];
  classBlocks: IClassBlock[];
  constBlocks: IConstBlock[];
} {
  const directives: IParsedDirective[] = [];
  const classBlocks: IClassBlock[] = [];
  const constBlocks: IConstBlock[] = [];

  let newText = text;

  // 1) parse @const <name> {...}
  const constRegex = /^[ \t]*@const\s+([\w-]+)\s*\{([\s\S]*?)\}/gm;
  const allConstMatches = [...newText.matchAll(constRegex)];
  for (const m of allConstMatches) {
    const fullMatch = m[0];
    const constName = m[1];
    const rawBlock = m[2];
    // parse lines => partial styleDef
    const partialDef = createEmptyStyleDef();
    const lines = rawBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const ln of lines) {
      // isConstContext=true => ห้าม !important / @query / local var ฯลฯ
      parseSingleAbbr(ln, partialDef, true, false);
    }
    constBlocks.push({ name: constName, styleDef: partialDef });
    newText = newText.replace(fullMatch, '').trim();
  }

  // 2) directiveRegex => @scope, @bind, ...
  const directiveRegex = /^[ \t]*@([\w-]+)\s+([^\r\n]+)/gm;
  let dMatch: RegExpExecArray | null;
  directiveRegex.lastIndex = 0;
  while ((dMatch = directiveRegex.exec(newText)) !== null) {
    const dirName = dMatch[1];
    const dirValue = dMatch[2].trim();
    if (dirName === 'use' || dirName === 'query') {
      continue;
    }
    directives.push({ name: dirName, value: dirValue });
    newText = newText.replace(dMatch[0], '').trim();
    directiveRegex.lastIndex = 0;
  }

  // 3) parse .className { ... } => nested brace
  const blocks = parseClassBlocksWithBraceCounting(newText);
  for (const blk of blocks) {
    classBlocks.push(blk);
  }

  return { directives, classBlocks, constBlocks };
}
