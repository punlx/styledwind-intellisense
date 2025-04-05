import { parseSingleAbbr } from '../parsers/parseSingleAbbr';
import { IClassBlock, IStyleDefinition } from '../types';
import { extractQueryBlocks } from '../utils/extractQueryBlocks';
import { mergeStyleDef } from '../utils/mergeStyleDef';
import { createEmptyStyleDef } from './createEmptyStyleDef';

/* -------------------------------------------------------------------------
   Section I: processClassBlocks => handle @use, extractQueryBlocks, parse lines ...
   ------------------------------------------------------------------------- */
export function processClassBlocks(
  scopeName: string,
  classBlocks: IClassBlock[],
  constMap: Map<string, IStyleDefinition>
): Map<string, IStyleDefinition> {
  const localClasses = new Set<string>();
  const result = new Map<string, IStyleDefinition>();

  for (const block of classBlocks) {
    const clsName = block.className;

    // -----------------------------
    // 1) กันซ้ำภายในไฟล์ (local)
    // -----------------------------
    if (localClasses.has(clsName)) {
      throw new Error(
        `[SWD-ERR] Duplicate class ".${clsName}" in scope "${scopeName}" (same file).`
      );
    }
    localClasses.add(clsName);

    // กันซ้ำ cross-file (ถ้า scopeName!=='none')
    if (scopeName !== 'none') {
      // const key = `${scopeName}:${clsName}`;
      // if (usedScopeClasses.has(key)) {
      //   throw new Error(
      //     `[SWD-ERR] class ".${clsName}" in scope "${scopeName}" is already used in another file.`
      //   );
      // }
      // usedScopeClasses.add(key);
    }

    const classStyleDef = createEmptyStyleDef();

    // (A) ดึง @query block ออก
    const { queries, newBody } = extractQueryBlocks(block.body);
    const realQueryBlocks = queries.map((q) => ({
      selector: q.selector,
      styleDef: createEmptyStyleDef(),
    }));
    classStyleDef.queries = realQueryBlocks;

    // (B) parse lines (split \n) => หา @use => merge
    const lines = newBody
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let usedConstNames: string[] = [];
    const normalLines: string[] = [];
    for (const ln of lines) {
      if (ln.startsWith('@use ')) {
        if (usedConstNames.length > 0) {
          throw new Error(`[SWD-ERR] Multiple @use lines in ".${clsName}".`);
        }
        const tokens = ln.replace('@use', '').trim().split(/\s+/);
        usedConstNames = tokens;
      } else {
        normalLines.push(ln);
      }
    }
    // -----------------------------------
    // (A) Merge const ก่อน -> เป็น baseline
    // -----------------------------------
    if (usedConstNames.length > 0) {
      for (const cName of usedConstNames) {
        if (!constMap.has(cName)) {
          throw new Error(`[SWD-ERR] @use refers to unknown const "${cName}".`);
        }
        const partialDef = constMap.get(cName)!;
        mergeStyleDef(classStyleDef, partialDef);
      }
    }

    // -----------------------------------
    // (B) ค่อย parse บรรทัดปกติ -> override
    // -----------------------------------
    for (const ln of normalLines) {
      parseSingleAbbr(ln, classStyleDef);
    }

    // -----------------------------
    // C) parse ภายใน query block
    // -----------------------------
    for (let i = 0; i < realQueryBlocks.length; i++) {
      const qBlock = realQueryBlocks[i];
      const qRawBody = queries[i].rawBody;

      // **คัดลอก localVars จาก parent => query styleDef**
      // เพื่อให้ query block มองเห็น var ที่ parent ประกาศ
      if (!qBlock.styleDef.localVars) {
        qBlock.styleDef.localVars = {};
      }
      if (classStyleDef.localVars) {
        // merge เข้าไป
        Object.assign(qBlock.styleDef.localVars, classStyleDef.localVars);
      }

      const qLines = qRawBody
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      let usedConstNamesQ: string[] = [];
      const normalQLines: string[] = [];

      for (const qLn of qLines) {
        if (qLn.startsWith('@use ')) {
          const tokens = qLn.replace('@use', '').trim().split(/\s+/);
          usedConstNamesQ.push(...tokens);
        } else {
          normalQLines.push(qLn);
        }
      }

      // merge const (ห้ามมี $variable => hasRuntimeVar ?)
      for (const cName of usedConstNamesQ) {
        if (!constMap.has(cName)) {
          throw new Error(`[SWD-ERR] @use unknown const "${cName}" in @query block.`);
        }
        // ตัวอย่าง code เดิมห้าม partialDef.hasRuntimeVar => throw
        const partialDef = constMap.get(cName)!;
        if (partialDef.hasRuntimeVar) {
          throw new Error(
            `[SWD-ERR] @use "${cName}" has $variable, not allowed inside @query block.`
          );
        }
        mergeStyleDef(qBlock.styleDef, partialDef);
      }
      // parse normal lines => isQueryBlock=true
      for (const ln of normalQLines) {
        parseSingleAbbr(ln, qBlock.styleDef, false, true);
      }
    }

    // 6) **ตรวจว่า usedLocalVars ทุกตัวถูกประกาศหรือไม่**
    // ตรวจที่ classStyleDef
    if ((classStyleDef as any)._usedLocalVars) {
      for (const usedVar of (classStyleDef as any)._usedLocalVars) {
        if (!classStyleDef.localVars || !(usedVar in classStyleDef.localVars)) {
          throw new Error(
            `[SWD-ERR] local var "${usedVar}" is used but not declared in ".${clsName}" (scope="${scopeName}").`
          );
        }
      }
    }
    // ตรวจใน query blocks
    for (let i = 0; i < realQueryBlocks.length; i++) {
      const qStyleDef = realQueryBlocks[i].styleDef;
      if ((qStyleDef as any)._usedLocalVars) {
        for (const usedVar of (qStyleDef as any)._usedLocalVars) {
          if (!qStyleDef.localVars || !(usedVar in qStyleDef.localVars)) {
            // ชื่อ selector
            const sel = queries[i].selector;
            throw new Error(
              `[SWD-ERR] local var "${usedVar}" is used but not declared in query "${sel}" of ".${clsName}".`
            );
          }
        }
      }
    }

    // ตั้งชื่อ finalKey => scopeName==='none' ? clsName : scopeName_clsName
    const finalKey = scopeName === 'none' ? clsName : `${scopeName}_${clsName}`;
    result.set(finalKey, classStyleDef);
  }

  return result;
}
