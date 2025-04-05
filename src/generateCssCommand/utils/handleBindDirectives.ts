// src/generateCssCommand/utils/handleBindDirectives.ts

import { IParsedDirective, IStyleDefinition } from '../types';

/* -------------------------------------------------------------------------
   Section J: handleBindDirectives
   - ถ้าต้องการรวมชื่อ class => @bind main .box .grid ...
   ------------------------------------------------------------------------- */
export function handleBindDirectives(
  scopeName: string,
  directives: IParsedDirective[],
  classMap: Map<string, IStyleDefinition>
) {
  const localBindKeys = new Set<string>();

  // ตัวอย่าง: สมมติเราจะเก็บผล bind ไว้ใน "bindResults" => key => "class1 class2"
  // หรือบางโปรเจกต์ อาจต้องการ return Object (line runtime) => แล้ว transform
  // ที่นี่เราทำแบบง่าย: แค่ throw ถ้า syntax ผิด
  for (const d of directives) {
    if (d.name === 'bind') {
      const tokens = d.value.trim().split(/\s+/);
      if (tokens.length < 2) {
        throw new Error(`[SWD-ERR] Invalid @bind syntax: "${d.value}"`);
      }
      const bindKey = tokens[0]; // e.g. "main"
      const classRefs = tokens.slice(1); // e.g. [".box", ".grid"]

      if (localBindKeys.has(bindKey)) {
        throw new Error(`[SWD-ERR] @bind key "${bindKey}" is already used in this file.`);
      }
      localBindKeys.add(bindKey);

      // ตรวจว่า refs => ".box" => finalKey => "scope_box"
      // วิธีแก้:
      // 1) parse => clsName="box" => finalKey = scopeName==='none'? "box" : "scope_box"
      //    => แล้วเช็คว่า classMap.has( finalKey )
      const classNames: string[] = [];
      for (const ref of classRefs) {
        if (!ref.startsWith('.')) {
          throw new Error(`[SWD-ERR] @bind usage must reference classes with a dot. got "${ref}"`);
        }
        const shortCls = ref.slice(1);
        const finalKey = scopeName === 'none' ? shortCls : `${scopeName}_${shortCls}`;
        if (classMap.has(`${scopeName}_${bindKey}`)) {
          throw new Error(
            `[SWD-ERR] @bind key "${bindKey}" conflicts with existing class ".${bindKey}" in styled (scope="${scopeName}").`
          );
        }
        if (!classMap.has(finalKey)) {
          throw new Error(
            `[SWD-ERR] @bind referencing ".${shortCls}" but that class is not defined.`
          );
        }

        classNames.push(finalKey);
      }

      // จะเก็บลงไหน? สมมติ we do nothing or console.log
      // In real code, maybe store in a map or something
      // console.log(`@bind ${bindKey} => ${classNames.join(' ')}`);
    }
  }
}
