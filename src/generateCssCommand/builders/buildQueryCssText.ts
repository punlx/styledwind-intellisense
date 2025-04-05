// src/generateCssCommand/builders/buildQueryCssText.ts

import { IStyleDefinition } from '../types';

export function buildQueryCssText(
  parentDisplayName: string,
  selector: string,
  qDef: IStyleDefinition
): string {
  let out = '';

  // ----- base + local vars -----
  let baseProps = '';
  const localVars = (qDef as any)._resolvedLocalVars as Record<string, string> | undefined;
  if (localVars) {
    for (const localVarName in localVars) {
      baseProps += `${localVarName}:${localVars[localVarName]};`;
    }
  }
  if (Object.keys(qDef.base).length > 0) {
    for (const prop in qDef.base) {
      baseProps += `${prop}:${qDef.base[prop]};`;
    }
  }
  if (baseProps) {
    out += `.${parentDisplayName} ${selector}{${baseProps}}`;
  }

  // ----- states -----
  for (const state in qDef.states) {
    const obj = qDef.states[state];
    let props = '';
    for (const p in obj) {
      props += `${p}:${obj[p]};`;
    }
    out += `.${parentDisplayName} ${selector}:${state}{${props}}`;
  }

  // ----- screens -----
  for (const scr of qDef.screens) {
    let props = '';
    for (const p in scr.props) {
      props += `${p}:${scr.props[p]};`;
    }
    out += `@media only screen and ${scr.query}{.${parentDisplayName} ${selector}{${props}}}`;
  }

  // ----- containers -----
  for (const ctnr of qDef.containers) {
    let props = '';
    for (const p in ctnr.props) {
      props += `${p}:${ctnr.props[p]};`;
    }
    out += `@container ${ctnr.query}{.${parentDisplayName} ${selector}{${props}}}`;
  }

  // ----- pseudos (อัปเดตให้รองรับหลาย pseudo) -----
  if (qDef.pseudos) {
    for (const pseudoKey in qDef.pseudos) {
      const pseudoObj = qDef.pseudos[pseudoKey];
      if (!pseudoObj) continue;

      let pseudoProps = '';
      for (const p in pseudoObj) {
        pseudoProps += `${p}:${pseudoObj[p]};`;
      }

      // ใช้ map เดียวกัน หรือจะประกาศซ้ำก็ได้
      const pseudoSelector = `::${pseudoKey}`;
      out += `.${parentDisplayName} ${selector}${pseudoSelector}{${pseudoProps}}`;
    }
  }

  return out;
}
