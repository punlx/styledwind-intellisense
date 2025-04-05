// src/generateCssCommand/parsers/parsePseudoElementStyle.ts

import { abbrMap } from '../../constants';
import { convertCSSVariable } from '../helpers/convertCSSVariable';
import { detectImportantSuffix } from '../helpers/detectImportantSuffix';
import { separateStyleAndProperties } from '../helpers/separateStyleAndProperties';
import { IStyleDefinition } from '../types';

/** parsePseudoElementStyle - ex. before(bg[red]) **/
export function parsePseudoElementStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false
) {
  const openParenIdx = abbrLine.indexOf('(');
  const pseudoName = abbrLine.slice(0, openParenIdx).trim();
  const inside = abbrLine.slice(openParenIdx + 1, -1).trim();
  const propsInPseudo = inside.split(/ (?=[^\[\]]*(?:\[|$))/);

  const result: Record<string, string> = styleDef.pseudos[pseudoName] || {};
  styleDef.varPseudos = styleDef.varPseudos || {};
  styleDef.varPseudos[pseudoName] = styleDef.varPseudos[pseudoName] || {};

  for (const p of propsInPseudo) {
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
            `[SWD-ERR] Using local var "${matchVar}" in pseudo ${pseudoName} before it is declared in base.`
          );
        }
      }
    }

    if (abbr.startsWith('--&') && isImportant) {
      throw new Error(
        `[SWD-ERR] !important is not allowed with local var (${abbr}) in pseudo ${pseudoName}.`
      );
    }

    if (abbr === 'ct') {
      result['content'] = `"${val}"` + (isImportant ? ' !important' : '');
      continue;
    }

    const expansions = [`${abbr}[${val}]`];
    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      const isVariable = abbr2.startsWith('$');
      const realAbbr = isVariable ? abbr2.slice(1) : abbr2;

      // ----- ตรวจ usage ของ --&xxx ใน val2 -----
      if (val2.includes('--&')) {
        const usedLocalVars = val2.match(/--&([\w-]+)/g) || [];
        for (const usage of usedLocalVars) {
          const localVarName = usage.replace('--&', '');
          if (!styleDef.localVars?.[localVarName]) {
            throw new Error(
              `[SWD-ERR] Using local var "${usage}" in pseudo ${pseudoName} before it is declared in base.`
            );
          }
        }
      }

      // เดิม: if (realAbbr === 'f') => fontDict
      // ใหม่: if (realAbbr === 'ty') => typographyDict
      if (realAbbr === 'ty') {
        // TODO
        // const dictEntry = typographyDict.dict[val2] as Record<string, string> | undefined;
        // if (!dictEntry) {
        //   throw new Error(
        //     `[SWD-ERR] Typography key "${val2}" not found in theme.typography(...) for pseudo ${pseudoName}.`
        //   );
        // }
        // for (const [cssProp2, cssVal2] of Object.entries(dictEntry)) {
        //   result[cssProp2] = convertCSSVariable(cssVal2) + (isImportant ? ' !important' : '');
        // }
        // continue;
      }

      const cProp = abbrMap[realAbbr as keyof typeof abbrMap];
      if (!cProp) {
        throw new Error(`"${realAbbr}" not found in abbrMap for pseudo-element ${pseudoName}.`);
      }

      const finalVal = convertCSSVariable(val2);
      if (isVariable) {
        styleDef.varPseudos[pseudoName]![realAbbr] = finalVal;
        result[cProp] = `var(--${realAbbr}-${pseudoName})` + (isImportant ? ' !important' : '');
      } else if (val2.includes('--&')) {
        const replaced = val2.replace(/--&([\w-]+)/g, (_, varName) => {
          return `LOCALVAR(${varName})`;
        });
        result[cProp] = replaced + (isImportant ? ' !important' : '');
      } else {
        result[cProp] = finalVal + (isImportant ? ' !important' : '');
      }
    }
  }

  styleDef.pseudos[pseudoName] = result;
}
