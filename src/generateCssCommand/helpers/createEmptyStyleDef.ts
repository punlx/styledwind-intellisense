import { IStyleDefinition } from '../types';

/** สร้าง styleDef ว่างเปล่า **/
export function createEmptyStyleDef(): IStyleDefinition {
  return {
    base: {},
    states: {},
    screens: [],
    containers: [],
    pseudos: {},
    hasRuntimeVar: false,
  };
}
