import { abbrMap } from '../../constants';
import { convertCSSVariable } from '../helpers/convertCSSVariable';
import { detectImportantSuffix } from '../helpers/detectImportantSuffix';
import { separateStyleAndProperties } from '../helpers/separateStyleAndProperties';
import { IStyleDefinition } from '../types';

export function parseContainerStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false
) {
  const openParenIdx = abbrLine.indexOf('(');
  let inside = abbrLine.slice(openParenIdx + 1, -1).trim();
  const commaIdx = inside.indexOf(',');
  if (commaIdx === -1) {
    throw new Error(`"container" syntax error: ${abbrLine}`);
  }

  let containerPart = inside.slice(0, commaIdx).trim();
  const propsPart = inside.slice(commaIdx + 1).trim();

  if (!(containerPart.startsWith('min') || containerPart.startsWith('max'))) {
    const [bp] = containerPart.split(', ');
    // TODO
    // if (breakpoints.dict[bp]) {
    //   containerPart = containerPart.replace(bp, breakpoints.dict[bp]);
    // }
  }

  const bracketOpen = containerPart.indexOf('[');
  const bracketClose = containerPart.indexOf(']');
  if (bracketOpen === -1 || bracketClose === -1) {
    throw new Error(`"container" must contain e.g. min-w[600px]. Got ${containerPart}`);
  }

  const cAbbr = containerPart.slice(0, bracketOpen).trim();
  const cValue = containerPart.slice(bracketOpen + 1, bracketClose).trim();
  const cProp = abbrMap[cAbbr as keyof typeof abbrMap];
  if (!cProp) {
    throw new Error(`"${cAbbr}" not found in abbrMap for container.`);
  }

  const containerQuery = `(${cProp}:${cValue})`;
  const propsList = propsPart.split(/ (?=[^\[\]]*(?:\[|$))/);

  const containerProps: Record<string, string> = {};

  for (const p of propsList) {
    const { line: tokenNoBang, isImportant } = detectImportantSuffix(p);
    if (isConstContext && isImportant) {
      throw new Error(`[SWD-ERR] !important is not allowed in @const block. Found: "${abbrLine}"`);
    }

    const [abbr, val] = separateStyleAndProperties(tokenNoBang);
    if (!abbr) continue;

    // ----- ตรวจ usage ของ --&xxx ใน abbr -----
    if (abbr.includes('--&')) {
      const localVarMatches = abbr.match(/--&([\w-]+)/g) || [];
      for (const matchVar of localVarMatches) {
        const localVarName = matchVar.replace('--&', '');
        if (!styleDef.localVars?.[localVarName]) {
          throw new Error(
            `[SWD-ERR] Using local var "${matchVar}" in container(...) before it is declared in base.`
          );
        }
      }
    }

    const expansions = [`${abbr}[${val}]`];
    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      if (abbr2.startsWith('--&') && isImportant) {
        throw new Error(
          `[SWD-ERR] !important is not allowed with local var (${abbr2}) in container.`
        );
      }

      // ----- ตรวจ usage ของ --&xxx ใน val2 -----
      if (val2.includes('--&')) {
        const usedLocalVars = val2.match(/--&([\w-]+)/g) || [];
        for (const usage of usedLocalVars) {
          const localVarName = usage.replace('--&', '');
          if (!styleDef.localVars?.[localVarName]) {
            throw new Error(
              `[SWD-ERR] Using local var "${usage}" in container(...) before it is declared in base.`
            );
          }
        }
      }

      // เดิม: if (abbr2 === 'f') => fontDict
      // ใหม่: if (abbr2 === 'ty') => typographyDict
      if (abbr2 === 'ty') {
        // TODO
        // const dictEntry = typographyDict.dict[val2] as Record<string, string> | undefined;
        // if (!dictEntry) {
        //   throw new Error(`"${val2}" not found in theme.typography(...) (container).`);
        // }
        // for (const [cssProp2, cssVal2] of Object.entries(dictEntry)) {
        //   containerProps[cssProp2] =
        //     convertCSSVariable(cssVal2) + (isImportant ? ' !important' : '');
        // }
      } else {
        const cProp2 = abbrMap[abbr2 as keyof typeof abbrMap];
        if (!cProp2) {
          throw new Error(`"${abbr2}" not found in abbrMap (container).`);
        }
        if (val2.includes('--&')) {
          const replaced = val2.replace(/--&([\w-]+)/g, (_, varName) => {
            return `LOCALVAR(${varName})`;
          });
          containerProps[cProp2] = replaced + (isImportant ? ' !important' : '');
        } else {
          containerProps[cProp2] = convertCSSVariable(val2) + (isImportant ? ' !important' : '');
        }
      }
    }
  }

  styleDef.containers.push({
    query: containerQuery,
    props: containerProps,
  });
}
