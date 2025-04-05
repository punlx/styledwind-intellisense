import { IStyleDefinition } from '../types';
import { buildQueryCssText } from './buildQueryCssText';

/* -------------------------------------------------------------------------
   Section L: buildCssText
   ------------------------------------------------------------------------- */
export function buildCssText(displayName: string, styleDef: IStyleDefinition): string {
  let cssText = '';

  // ----- rootVars -----
  if (styleDef.rootVars) {
    let varBlock = '';
    for (const varName in styleDef.rootVars) {
      varBlock += `${varName}:${styleDef.rootVars[varName]};`;
    }
    if (varBlock) {
      cssText += `:root{${varBlock}}`;
    }
  }

  // ----- base + local vars -----
  let baseProps = '';
  const localVars = (styleDef as any)._resolvedLocalVars as Record<string, string> | undefined;
  if (localVars) {
    for (const localVarName in localVars) {
      baseProps += `${localVarName}:${localVars[localVarName]};`;
    }
  }
  if (Object.keys(styleDef.base).length > 0) {
    for (const prop in styleDef.base) {
      baseProps += `${prop}:${styleDef.base[prop]};`;
    }
  }
  if (baseProps) {
    cssText += `.${displayName}{${baseProps}}`;
  }

  // ----- states -----
  for (const state in styleDef.states) {
    const obj = styleDef.states[state];
    let props = '';
    for (const p in obj) {
      props += `${p}:${obj[p]};`;
    }
    cssText += `.${displayName}:${state}{${props}}`;
  }

  // ----- screens -----
  for (const scr of styleDef.screens) {
    let props = '';
    for (const p in scr.props) {
      props += `${p}:${scr.props[p]};`;
    }
    cssText += `@media only screen and ${scr.query}{.${displayName}{${props}}}`;
  }

  // ----- containers -----
  for (const ctnr of styleDef.containers) {
    let props = '';
    for (const p in ctnr.props) {
      props += `${p}:${ctnr.props[p]};`;
    }
    cssText += `@container ${ctnr.query}{.${displayName}{${props}}}`;
  }

  // ----- pseudos (อัปเดตให้รองรับหลาย pseudo) -----
  if (styleDef.pseudos) {
    for (const pseudoKey in styleDef.pseudos) {
      const pseudoObj = styleDef.pseudos[pseudoKey];
      if (!pseudoObj) continue;

      // รวม property ใน pseudoObj
      let pseudoProps = '';
      for (const prop in pseudoObj) {
        pseudoProps += `${prop}:${pseudoObj[prop]};`;
      }

      // เลือก selector ที่สอดคล้อง
      const pseudoSelector = `::${pseudoKey}`;
      cssText += `.${displayName}${pseudoSelector}{${pseudoProps}}`;
    }
  }

  // ----- queries -----
  if (styleDef.queries && styleDef.queries.length > 0) {
    for (const q of styleDef.queries) {
      cssText += buildQueryCssText(displayName, q.selector, q.styleDef);
    }
  }

  return cssText;
}
