// createSwdCssCommand.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/* -------------------------------------------------------------------------
   Section A: Global registry (scope uniqueness)
   - เก็บ scopeName และ scopeName:className ที่เจอข้ามไฟล์
   - ถ้าต้องการให้ความจำอยู่ข้ามการปิด-เปิด VSCode อาจต้องใช้ Memento หรือ GlobalState
   ------------------------------------------------------------------------- */
const usedScopes = new Set<string>();
const usedScopeClasses = new Set<string>();

function ensureScopeUnique(scopeName: string) {
  // ถ้า scopeName==='none' => ข้าม
  if (scopeName === 'none') return;

  // ถ้าเคยมี => throw หรือจะ console.warn ก็แล้วแต่
  // if (usedScopes.has(scopeName)) {
  //   throw new Error(`[SWD-ERR] scope "${scopeName}" was already used in another file.`);
  // }
  // usedScopes.add(scopeName);
}

/* -------------------------------------------------------------------------
   Section B: Interfaces
   ------------------------------------------------------------------------- */
interface IStyleDefinition {
  base: Record<string, string>;
  states: Record<string, Record<string, string>>;
  screens: Array<{
    query: string;
    props: Record<string, string>;
  }>;
  containers: Array<{
    query: string;
    props: Record<string, string>;
  }>;
  pseudos: {
    [key: string]: Record<string, string> | undefined;
  };
  varStates?: {
    [stateName: string]: Record<string, string>;
  };
  varBase?: Record<string, string>;
  varPseudos?: {
    [key: string]: Record<string, string>;
  };
  rootVars?: Record<string, string>;
  localVars?: Record<string, string>;
  queries?: IQueryBlock[];
  hasRuntimeVar?: boolean;
}

interface IQueryBlock {
  selector: string;
  styleDef: IStyleDefinition;
}

interface IParsedDirective {
  name: string;
  value: string;
}

interface IClassBlock {
  className: string;
  body: string;
}

interface IConstBlock {
  name: string;
  styleDef: IStyleDefinition;
}

/* -------------------------------------------------------------------------
   สำหรับฟีเจอร์ theme/globalDefineMap (คล้าย @const แต่ประกาศระดับ global)
   - หากต้องการ parse เพิ่มจากไฟล์อื่น หรือ theme.define(...) ก็สามารถขยาย logic ได้
   ------------------------------------------------------------------------- */
const globalDefineMap: Record<string, Record<string, IStyleDefinition>> = {};

/* -------------------------------------------------------------------------
   Section C: abbrMap + known states/pseudos
   (ตัวอย่างสั้น ๆ หากต้องการเพิ่มเติม ให้ใส่ใน abbrMap ได้)
   ------------------------------------------------------------------------- */
const supportedPseudos = [
  'before',
  'after',
  'placeholder',
  'selection',
  'file-selector-button',
  'first-letter',
  'first-line',
  'marker',
  'backdrop',
  'spelling-error',
  'grammar-error',
];

const knownStates = [
  'hover',
  'focus',
  'active',
  'focus-within',
  'focus-visible',
  'target',
  'disabled',
  'enabled',
  'read-only',
  'read-write',
  'required',
  'optional',
  'checked',
  'indeterminate',
  'valid',
  'invalid',
  'in-range',
  'out-of-range',
  'placeholder-shown',
  'default',
  'link',
  'visited',
  'user-invalid',
];

/** ตัวอย่าง abbrMap สั้นๆ **/
export const abbrMap = {
  // All
  a: 'all',
  // Alignment, Box, Display
  ac: 'align-content',
  ai: 'align-items',
  as: 'align-self',
  d: 'display',

  /********************************************
   * Animation
   ********************************************/
  am: 'animation',
  'am-delay': 'animation-delay',
  'am-drt': 'animation-direction',
  'am-dur': 'animation-duration',
  'am-fill': 'animation-fill-mode',
  'am-count': 'animation-iteration-count',
  'am-name': 'animation-name',
  'am-play': 'animation-play-state',
  'am-timefun': 'animation-timing-function',

  /********************************************
   * Background
   ********************************************/
  bg: 'background-color',
  'bg-img': 'background-image',
  'bg-pos': 'background-position',
  'bg-size': 'background-size',
  'bg-repeat': 'background-repeat',
  'bg-clip': 'background-clip',
  'bg-origin': 'background-origin',
  'bg-blend': 'background-blend-mode',

  /********************************************
   * Border / Outline
   ********************************************/
  bd: 'border',
  bdl: 'border-left',
  bdt: 'border-top',
  bdr: 'border-right',
  bdb: 'border-bottom',
  'bd-w': 'border-width',
  'bd-c': 'border-color',
  'bd-st': 'border-style',

  'bdl-w': 'border-left-width',
  'bdl-c': 'border-left-color',
  'bdl-st': 'border-left-style',

  'bdt-w': 'border-top-width',
  'bdt-c': 'border-top-color',
  'bdt-st': 'border-top-style',

  'bdr-w': 'border-right-width',
  'bdr-c': 'border-right-color',
  'bdr-st': 'border-right-style',

  'bdb-w': 'border-bottom-width',
  'bdb-c': 'border-bottom-color',
  'bdb-st': 'border-bottom-style',

  'bd-spacing': 'border-spacing',
  'bd-collapse': 'border-collapse',
  'bd-img': 'border-image',
  br: 'border-radius',
  ol: 'outline',
  'ol-w': 'outline-width',
  'ol-c': 'outline-color',
  'ol-st': 'outline-style',
  'ol-ofs': 'outline-offset',

  /********************************************
   * Box Shadow / Sizing
   ********************************************/
  sd: 'box-shadow',
  bs: 'box-sizing',

  /********************************************
   * Color, Cursor
   ********************************************/
  c: 'color',
  cs: 'cursor',

  /********************************************
   * Container Query
   ********************************************/
  'ctn-type': 'container-type',
  ctn: 'container',
  'ctn-name': 'container-name',

  /********************************************
   * Columns / Gap
   ********************************************/
  cols: 'columns',
  'col-gap': 'column-gap',
  'row-gap': 'row-gap',
  gap: 'gap',

  /********************************************
   * Flex / Grid
   ********************************************/
  fx: 'flex',
  'fx-basis': 'flex-basis',
  basis: 'flex-basis',
  wrap: 'flex-wrap',
  drt: 'flex-direction',
  flow: 'flex-flow',
  grow: 'flex-grow',
  shrink: 'flex-shrink',

  gd: 'grid',
  'gd-area': 'grid-area',
  'gd-auto-cols': 'grid-auto-columns',
  'gd-auto-flow': 'grid-auto-flow',
  'gd-auto-rows': 'grid-auto-rows',
  'gd-col': 'grid-column',
  'gd-col-end': 'grid-column-end',
  'gd-col-gap': 'grid-column-gap',
  'gd-col-start': 'grid-column-start',
  'gd-gap': 'grid-gap',
  'gd-row': 'grid-row',
  'gd-row-end': 'grid-row-end',
  'gd-row-gap': 'grid-row-gap',
  'gd-row-start': 'grid-row-start',
  'gd-temp': 'grid-template',
  'gd-temp-areas': 'grid-template-areas',
  'gd-temp-cols': 'grid-template-columns',
  'gd-temp-rows': 'grid-template-rows',

  /********************************************
   * Justify / Align / Place
   ********************************************/
  jc: 'justify-content',
  ji: 'justify-items',
  js: 'justify-self',
  pc: 'place-content',
  pi: 'place-items',
  ps: 'place-self',

  /********************************************
   * Font / Text
   ********************************************/
  // เปลี่ยนมาใช้ f => 'font' (แทนที่จะ parse เป็น theme.font)
  f: 'font',
  // ต้องมี typography เพื่อเช็คว่า ty ยังสามารถใช้ได้
  ty: 'typography',
  fm: 'font-family',
  fs: 'font-size',
  fw: 'font-weight',
  fst: 'font-style',
  fv: 'font-variant',
  ffs: 'font-feature-settings',
  lh: 'line-height',
  'let-sp': 'letter-spacing',
  'word-sp': 'word-spacing',

  'tx-ali': 'text-align',
  'tx-decor': 'text-decoration',
  'tx-ind': 'text-indent',
  'tx-jtf': 'text-justify',
  'tx-ovf': 'text-overflow',
  'tx-sd': 'text-shadow',
  'tx-tf': 'text-transform',
  'tx-wrap': 'text-wrap',
  'tx-unde-pos': 'text-underline-position',
  'tx-break': 'word-break',
  'tx-ws': 'white-space',

  'tx-adj': 'text-size-adjust',
  'tx-decor-line': 'text-decoration-line',
  'tx-decor-color': 'text-decoration-color',
  'tx-decor-style': 'text-decoration-style',
  'tx-decor-skip': 'text-decoration-skip-ink',

  /********************************************
   * Filter / Blend / Backdrop
   ********************************************/
  fil: 'filter',
  bf: 'backdrop-filter',
  '-webkit-bf': '-webkit-backdrop-filter',
  mbm: 'mix-blend-mode',

  /********************************************
   * Dimensions / Spacing
   ********************************************/
  w: 'width',
  'max-w': 'max-width',
  'min-w': 'min-width',
  h: 'height',
  'max-h': 'max-height',
  'min-h': 'min-height',

  m: 'margin',
  ml: 'margin-left',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',

  p: 'padding',
  pl: 'padding-left',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',

  /********************************************
   * Position
   ********************************************/
  pos: 'position',
  l: 'left',
  t: 'top',
  r: 'right',
  b: 'bottom',
  z: 'z-index',

  /********************************************
   * Object
   ********************************************/
  'obj-fit': 'object-fit',
  'obj-pos': 'object-position',

  /********************************************
   * Aspect Ratio
   ********************************************/
  ar: 'aspect-ratio',

  /********************************************
   * Overflow / Scroll Behavior
   ********************************************/
  ovf: 'overflow',
  'ovf-x': 'overflow-x',
  'ovf-y': 'overflow-y',
  'scr-beh': 'scroll-behavior',
  'ovscr-beh': 'overscroll-behavior',
  'ovscr-beh-x': 'overscroll-behavior-x',
  'ovscr-beh-y': 'overscroll-behavior-y',
  rs: 'resize',
  op: 'opacity',

  /********************************************
   * Opacity, Pointer Events, Cursor
   ********************************************/
  pe: 'pointer-events',

  /********************************************
   * Transform / Transition / Will-change
   ********************************************/
  tf: 'transform',
  'tf-origin': 'transform-origin',
  'tf-box': 'transform-box',
  'tf-style': 'transform-style',
  per: 'perspective',
  'per-origin': 'perspective-origin',
  'backface-vis': 'backface-visibility',

  tsn: 'transition',
  'tsn-delay': 'transition-delay',
  'tsn-dur': 'transition-duration',
  'tsn-prop': 'transition-property',
  'tsn-fn': 'transition-timing-function',
  wc: 'will-change',

  /********************************************
   * Mask / Clip
   ********************************************/
  mask: 'mask',
  'mask-img': 'mask-image',
  '-webkit-mask': '-webkit-mask',
  '-webkit-mask-img': '-webkit-mask-image',
  'clip-path': 'clip-path',
  '-webkit-clip-path': '-webkit-clip-path',

  /********************************************
   * Appearance / User-select
   ********************************************/
  app: 'appearance',
  '-webkit-app': '-webkit-appearance',

  us: 'user-select',
  '-webkit-sel': '-webkit-user-select',

  /********************************************
   * Misc
   ********************************************/
  iso: 'isolation',
  ct: 'content',
} as const;

/* -------------------------------------------------------------------------
   Section D: Helper สำหรับสร้าง styleDef / parse abbr / etc.
   ------------------------------------------------------------------------- */

/** สร้าง styleDef ว่างเปล่า **/
function createEmptyStyleDef(): IStyleDefinition {
  return {
    base: {},
    states: {},
    screens: [],
    containers: [],
    pseudos: {},
    hasRuntimeVar: false,
  };
}

/** แยก abbrLine => ตัวอย่าง "bg[red]" => ["bg","red"] **/
function separateStyleAndProperties(abbr: string): [string, string] {
  const match = /^([\w\-\$\&]+)\[(.*)\]$/.exec(abbr.trim());
  if (!match) return ['', ''];
  return [match[1], match[2]];
}

/** replace "--xxx" => "var(--xxx)" **/
function convertCSSVariable(value: string): string {
  if (value.includes('--')) {
    return value.replace(/(--[\w-]+)/g, 'var($1)');
  }
  return value;
}

/** detect !important (ลงท้ายด้วย "]!") **/
function detectImportantSuffix(raw: string): { line: string; isImportant: boolean } {
  let trimmed = raw.trim();
  let isImportant = false;
  if (trimmed.endsWith(']!')) {
    isImportant = true;
    trimmed = trimmed.slice(0, -1); // ตัด '!' ออก
  }
  return { line: trimmed, isImportant };
}

/* -------------------------------------------------------------------------
   parseVariableAbbr + buildVariableName (รองรับ $bg-hover => base: "bg", suffix: "hover")
   ------------------------------------------------------------------------- */
export function parseVariableAbbr(abbr: string): { baseVarName: string; suffix: string } {
  if (!abbr.startsWith('$')) {
    throw new Error(`[SWD-ERR] Only $variable is supported. Got "${abbr}"`);
  }
  const varNameFull = abbr.slice(1); // ตัด '$'
  let baseVarName = varNameFull;
  let suffix = '';

  const dashIdx = varNameFull.lastIndexOf('-');
  if (dashIdx > 0) {
    baseVarName = varNameFull.slice(0, dashIdx);
    suffix = varNameFull.slice(dashIdx + 1);
  }
  return { baseVarName, suffix };
}

/* -------------------------------------------------------------------------
  checkAndReplaceLocalVarUsage
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   Section E: parseSingleAbbr - parse base/state/pseudo/... + !important checks
   ------------------------------------------------------------------------- */

/** parseBaseStyle **/
export function parseBaseStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false,
  isQueryBlock: boolean = false
) {
  // 1) ตรวจ !important + แยก abbr / prop
  const { line: abbrLineNoBang, isImportant } = detectImportantSuffix(abbrLine);
  if (isConstContext && isImportant) {
    throw new Error(
      `[SWD-ERR] !important is not allowed in @const (or theme.define) block. Found: "${abbrLine}"`
    );
  }

  const [styleAbbr, propValue] = separateStyleAndProperties(abbrLineNoBang);
  if (!styleAbbr) {
    return;
  }

  // 2) ถ้า abbr ซ้ำทั้ง abbrMap และ globalDefineMap => error
  if (styleAbbr in abbrMap && styleAbbr in globalDefineMap) {
    throw new Error(
      `[SWD-ERR] "${styleAbbr}" is defined in both abbrMap and theme.define(...) - name collision not allowed.`
    );
  }

  // 3) local var: --&xxx
  if (styleAbbr.startsWith('--&')) {
    if (isConstContext) {
      throw new Error(
        `[SWD-ERR] Local var "${styleAbbr}" not allowed inside @const/theme.define block.`
      );
    }
    if (isQueryBlock) {
      throw new Error(`[SWD-ERR] Local var "${styleAbbr}" not allowed inside @query block.`);
    }
    if (isImportant) {
      throw new Error(`[SWD-ERR] !important is not allowed with local var "${styleAbbr}".`);
    }

    if (!styleDef.localVars) {
      styleDef.localVars = {};
    }
    const localVarName = styleAbbr.slice(3); // "--&"
    if (styleDef.localVars[localVarName] != null) {
      throw new Error(`[SWD-ERR] local var "${localVarName}" is already declared in this class.`);
    }
    styleDef.localVars[localVarName] = convertCSSVariable(propValue);
    return;
  }

  // 4) ถ้าเป็น $variable
  const isVariable = styleAbbr.startsWith('$');
  if (isVariable) {
    if (isQueryBlock) {
      throw new Error(
        `[SWD-ERR] Runtime variable ($var) not allowed inside @query block. Found: "${abbrLine}"`
      );
    }
    const realAbbr = styleAbbr.slice(1); // ตัด '$'
    const expansions = [`${realAbbr}[${propValue}]`];
    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      if (val2.includes('--&')) {
        throw new Error(
          `[SWD-ERR] $variable is not allowed to reference local var (--&xxx). Found: "${abbrLine}"`
        );
      }

      const cssProp = abbrMap[abbr2 as keyof typeof abbrMap];
      if (!cssProp) {
        throw new Error(`"${abbr2}" not defined in abbrMap. (abbrLine=${abbrLine})`);
      }
      const finalVal = convertCSSVariable(val2);

      if (!styleDef.varBase) {
        styleDef.varBase = {};
      }
      styleDef.varBase[realAbbr] = finalVal;

      styleDef.base[cssProp] = `var(--${realAbbr})${isImportant ? ' !important' : ''}`;
    }
    return;
  }

  // 5) ถ้าไม่ใช่ localVar และไม่ใช่ $var => เช็ค abbrMap / globalDefineMap
  if (!(styleAbbr in abbrMap)) {
    // ลอง globalDefineMap
    if (styleAbbr in globalDefineMap) {
      const tokens = propValue.split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        throw new Error(
          `[SWD-ERR] Multiple subKey not allowed. Found: "${styleAbbr}[${propValue}]"`
        );
      }
      const subK = tokens[0];
      if (!subK) {
        throw new Error(`[SWD-ERR] Missing subKey for "${styleAbbr}[...]"`);
      }
      const partialDef = globalDefineMap[styleAbbr][subK];
      if (!partialDef) {
        throw new Error(`[SWD-ERR] "${styleAbbr}[${subK}]" not found in theme.define(...)`);
      }
      mergeStyleDef(styleDef, partialDef);
      return;
    }
    throw new Error(
      `"${styleAbbr}" not defined in abbrMap or theme.define(...) (abbrLine=${abbrLine})`
    );
  }

  // 6) ถ้าอยู่ใน abbrMap => parse normal abbr ex. "bg[red]"
  if (styleAbbr === 'ty') {
    // TODO
    // const dictEntry = typographyDict.dict[propValue];
    // if (!dictEntry) {
    //   throw new Error(
    //     `[SWD-ERR] Typography key "${propValue}" not found in theme.typography(...) dict.`
    //   );
    // }
    // for (const [cssProp, cssVal] of Object.entries(dictEntry)) {
    //   styleDef.base[cssProp] = convertCSSVariable(cssVal) + (isImportant ? ' !important' : '');
    // }
    // return;
  }

  const expansions = [`${styleAbbr}[${propValue}]`];
  for (const ex of expansions) {
    const [abbr2, val2] = separateStyleAndProperties(ex);
    if (!abbr2) continue;

    const cssProp = abbrMap[abbr2 as keyof typeof abbrMap];
    if (!cssProp) {
      throw new Error(`"${abbr2}" not defined in abbrMap. (abbrLine=${abbrLine})`);
    }

    let finalVal = convertCSSVariable(val2);
    if (val2.includes('--&')) {
      // ตรงนี้เก็บว่าใช้ localVar อะไร
      finalVal = val2.replace(/--&([\w-]+)/g, (_, varName) => {
        // บันทึกว่ามีการ "ใช้" localVar varName
        if (!(styleDef as any)._usedLocalVars) {
          (styleDef as any)._usedLocalVars = new Set<string>();
        }
        (styleDef as any)._usedLocalVars.add(varName);

        return `LOCALVAR(${varName})`;
      });
      styleDef.base[cssProp] = finalVal + (isImportant ? ' !important' : '');
    } else {
      styleDef.base[cssProp] = finalVal + (isImportant ? ' !important' : '');
    }
  }
}
/** parseStateStyle - ex. hover(bg[red]) **/
export function parseStateStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false
) {
  const openParenIdx = abbrLine.indexOf('(');
  const funcName = abbrLine.slice(0, openParenIdx).trim(); // "hover", "focus", etc.
  const inside = abbrLine.slice(openParenIdx + 1, -1).trim();

  const propsInState = inside.split(/ (?=[^\[\]]*(?:\[|$))/);
  const result: Record<string, string> = {};

  for (const p of propsInState) {
    const { line: tokenNoBang, isImportant } = detectImportantSuffix(p);
    if (isConstContext && isImportant) {
      throw new Error(`[SWD-ERR] !important is not allowed in @const block. Found: "${abbrLine}"`);
    }

    const [abbr, val] = separateStyleAndProperties(tokenNoBang);
    if (!abbr) continue;

    const expansions = [`${abbr}[${val}]`];
    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      if (abbr2.startsWith('--&') && isImportant) {
        throw new Error(
          `[SWD-ERR] !important is not allowed with local var (${abbr2}) in state ${funcName}.`
        );
      }

      const isVar = abbr2.startsWith('$');
      const realAbbr = isVar ? abbr2.slice(1) : abbr2;

      // เดิม: if (realAbbr==='f') => fontDict
      // ใหม่: if (realAbbr==='ty') => typographyDict
      if (realAbbr === 'ty') {
        // TODO
        // const dictEntry = typographyDict.dict[val2] as Record<string, string> | undefined;
        // if (!dictEntry) {
        //   throw new Error(
        //     `[SWD-ERR] Typography key "${val2}" not found in theme.typography(...) for state ${funcName}.`
        //   );
        // }
        // for (const [cssProp2, cssVal2] of Object.entries(dictEntry)) {
        //   result[cssProp2] = convertCSSVariable(cssVal2) + (isImportant ? ' !important' : '');
        // }
        // continue;
      }

      const cProp = abbrMap[realAbbr as keyof typeof abbrMap];
      if (!cProp) {
        throw new Error(`"${realAbbr}" not found in abbrMap for state ${funcName}.`);
      }

      let finalVal = convertCSSVariable(val2);
      if (isVar) {
        styleDef.varStates = styleDef.varStates || {};
        styleDef.varStates[funcName] = styleDef.varStates[funcName] || {};
        styleDef.varStates[funcName][realAbbr] = finalVal;

        result[cProp] = `var(--${realAbbr}-${funcName})` + (isImportant ? ' !important' : '');
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

  styleDef.states[funcName] = result;
}

/** parsePseudoElementStyle - ex. before(bg[red]) **/
function parsePseudoElementStyle(
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

/** (option) parseContainerStyle / parseScreenStyle ถ้าต้องการ container/screen
    - ตัวอย่าง omitted หรือ simplified ...
**/

export function parseScreenStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false
) {
  const openParenIdx = abbrLine.indexOf('(');
  let inside = abbrLine.slice(openParenIdx + 1, -1).trim();

  // TODO
  // if (!(inside.startsWith('min') || inside.startsWith('max'))) {
  //   const [bp] = inside.split(', ');
  //   if (breakpoints.dict[bp]) {
  //     inside = inside.replace(bp, breakpoints.dict[bp]);
  //   }
  // }

  const commaIdx = inside.indexOf(',');
  if (commaIdx === -1) {
    throw new Error(`"screen" syntax error: ${abbrLine}`);
  }

  const screenPart = inside.slice(0, commaIdx).trim();
  const propsPart = inside.slice(commaIdx + 1).trim();

  const bracketOpen = screenPart.indexOf('[');
  const bracketClose = screenPart.indexOf(']');
  if (bracketOpen === -1 || bracketClose === -1) {
    throw new Error(`"screen" must contain something like min-w[600px]. Got ${screenPart}`);
  }

  const screenAbbr = screenPart.slice(0, bracketOpen).trim();
  const screenValue = screenPart.slice(bracketOpen + 1, bracketClose).trim();
  const screenProp = abbrMap[screenAbbr as keyof typeof abbrMap];
  if (!screenProp) {
    throw new Error(`"${screenAbbr}" not found in abbrMap or not min-w/max-w`);
  }

  const mediaQuery = `(${screenProp}:${screenValue})`;

  const styleList = propsPart.split(/ (?=[^\[\]]*(?:\[|$))/);
  const screenProps: Record<string, string> = {};

  for (const p of styleList) {
    const { line: tokenNoBang, isImportant } = detectImportantSuffix(p);
    if (isConstContext && isImportant) {
      throw new Error(`[SWD-ERR] !important is not allowed in @const block. Found: "${abbrLine}"`);
    }

    const [abbr, val] = separateStyleAndProperties(tokenNoBang);
    if (!abbr) continue;

    const expansions = [`${abbr}[${val}]`];

    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      if (abbr2.startsWith('--&') && isImportant) {
        throw new Error(`[SWD-ERR] !important is not allowed with local var (${abbr2}) in screen.`);
      }

      // เดิม: if (abbr2 === 'f') => fontDict
      // ใหม่: if (abbr2 === 'ty') => typographyDict
      if (abbr2 === 'ty') {
        // todo
        // const dictEntry = typographyDict.dict[val2] as Record<string, string> | undefined;
        // if (!dictEntry) {
        //   throw new Error(`"${val2}" not found in theme.typography(...) (screen).`);
        // }
        // for (const [cssProp2, cssVal2] of Object.entries(dictEntry)) {
        //   screenProps[cssProp2] = convertCSSVariable(cssVal2) + (isImportant ? ' !important' : '');
        // }
      } else {
        const cProp = abbrMap[abbr2 as keyof typeof abbrMap];
        if (!cProp) {
          throw new Error(`"${abbr2}" not found in abbrMap (screen).`);
        }
        if (val2.includes('--&')) {
          const replaced = val2.replace(/--&([\w-]+)/g, (_, varName) => {
            return `LOCALVAR(${varName})`;
          });
          screenProps[cProp] = replaced + (isImportant ? ' !important' : '');
        } else {
          screenProps[cProp] = convertCSSVariable(val2) + (isImportant ? ' !important' : '');
        }
      }
    }
  }

  styleDef.screens.push({ query: mediaQuery, props: screenProps });
}

function parseContainerStyle(
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

    const expansions = [`${abbr}[${val}]`];
    for (const ex of expansions) {
      const [abbr2, val2] = separateStyleAndProperties(ex);
      if (!abbr2) continue;

      if (abbr2.startsWith('--&') && isImportant) {
        throw new Error(
          `[SWD-ERR] !important is not allowed with local var (${abbr2}) in container.`
        );
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

/** parseSingleAbbr - ตรวจ prefix '(' => state/pseudo/container/screen หรือ else base **/
function parseSingleAbbr(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean = false,
  isQueryBlock: boolean = false,
  isDefineContext: boolean = false
) {
  const trimmed = abbrLine.trim();

  // ถ้า isDefineContext => ห้าม $variable (เฉพาะ theme.define)
  if (isDefineContext && /^\$[\w-]+\[/.test(trimmed)) {
    throw new Error(
      `[SWD-ERR] $variable is not allowed in theme.define block. Found: "${trimmed}"`
    );
  }

  // ถ้าอยู่ใน context ของ @const / theme.define => ห้ามมี @query
  if (isConstContext && trimmed.startsWith('@query')) {
    throw new Error(
      `[SWD-ERR] @query is not allowed in @const or theme.define() block. Found: "${trimmed}"`
    );
  }

  // ถ้าอยู่ใน query block (isQueryBlock=true) => ห้าม nested @query
  if (isQueryBlock && trimmed.startsWith('@query')) {
    throw new Error(`[SWD-ERR] Nested @query is not allowed.`);
  }

  // และใน query block ห้าม $var / local var ตามโค้ดเดิม
  if (isQueryBlock) {
    if (/^--&[\w-]+\[/.test(trimmed)) {
      throw new Error(`[SWD-ERR] Local var not allowed inside @query block. Found: "${trimmed}"`);
    }
    if (/^\$[\w-]+\[/.test(trimmed)) {
      throw new Error(
        `[SWD-ERR] Runtime variable ($var) not allowed inside @query block. Found: "${trimmed}"`
      );
    }
  }

  // ถ้ายังไม่มี hasRuntimeVar ใน styleDef และเจอ $... => set hasRuntimeVar
  if (!styleDef.hasRuntimeVar && /\$[\w-]+\[/.test(trimmed)) {
    styleDef.hasRuntimeVar = true;
  }

  // ตรวจว่ามี "(" -> อาจเป็น state/pseudo/screen/container
  const openParenIndex = trimmed.indexOf('(');
  if (openParenIndex === -1) {
    parseBaseStyle(trimmed, styleDef, isConstContext, isQueryBlock);
    return;
  }

  const prefix = trimmed.slice(0, openParenIndex);

  if (knownStates.includes(prefix)) {
    parseStateStyle(trimmed, styleDef, isConstContext);
    return;
  }
  if (supportedPseudos.includes(prefix)) {
    parsePseudoElementStyle(trimmed, styleDef, isConstContext);
    return;
  }
  if (prefix === 'screen') {
    parseScreenStyle(trimmed, styleDef, isConstContext);
    return;
  }
  if (prefix === 'container') {
    parseContainerStyle(trimmed, styleDef, isConstContext);
    return;
  }

  // ถ้าไม่เข้า case ข้างบน => parse base
  parseBaseStyle(trimmed, styleDef, isConstContext, isQueryBlock);
}

/* -------------------------------------------------------------------------
   Section F: extractQueryBlocks (สำหรับ @query <selector> {...})
   ------------------------------------------------------------------------- */
const queryRegex = /@query\s+([^{]+)\s*\{([\s\S]*?)\}/g;

function extractQueryBlocks(classBody: string): {
  queries: Array<{ selector: string; rawBody: string }>;
  newBody: string;
} {
  const queries: Array<{ selector: string; rawBody: string }> = [];
  let newBody = classBody;
  let match: RegExpExecArray | null;

  while ((match = queryRegex.exec(classBody)) !== null) {
    const raw = match[0];
    const selector = match[1].trim();
    const rawQueryBlockBody = match[2].trim();
    newBody = newBody.replace(raw, '').trim();
    queries.push({ selector, rawBody: rawQueryBlockBody });
  }
  return { queries, newBody };
}

/* -------------------------------------------------------------------------
   Section G: mergeStyleDef(target, source)
   - สำหรับ @use/@const/etc. => นำ partial styleDef มารวม
   ------------------------------------------------------------------------- */
function mergeStyleDef(target: IStyleDefinition, source: IStyleDefinition) {
  // base
  for (const prop in source.base) {
    target.base[prop] = source.base[prop];
  }
  // states
  for (const st in source.states) {
    if (!target.states[st]) {
      target.states[st] = {};
    }
    for (const p in source.states[st]) {
      target.states[st][p] = source.states[st][p];
    }
  }
  // screens
  for (const s of source.screens) {
    // naive: push
    target.screens.push({ query: s.query, props: { ...s.props } });
  }
  // containers
  for (const c of source.containers) {
    target.containers.push({ query: c.query, props: { ...c.props } });
  }
  // pseudos
  for (const pName in source.pseudos) {
    if (!target.pseudos[pName]) {
      target.pseudos[pName] = {};
    }
    const fromPseudo = source.pseudos[pName]!;
    for (const prop in fromPseudo) {
      target.pseudos[pName]![prop] = fromPseudo[prop];
    }
  }

  // varBase
  if (source.varBase) {
    if (!target.varBase) {
      target.varBase = {};
    }
    for (const k in source.varBase) {
      target.varBase[k] = source.varBase[k];
    }
  }
  // varStates
  if (source.varStates) {
    if (!target.varStates) {
      target.varStates = {};
    }
    for (const stName in source.varStates) {
      if (!target.varStates[stName]) {
        target.varStates[stName] = {};
      }
      for (const k in source.varStates[stName]) {
        target.varStates[stName][k] = source.varStates[stName][k];
      }
    }
  }
  // varPseudos
  if (source.varPseudos) {
    if (!target.varPseudos) {
      target.varPseudos = {};
    }
    for (const pseudoKey in source.varPseudos) {
      if (!target.varPseudos[pseudoKey]) {
        target.varPseudos[pseudoKey] = {};
      }
      for (const k in source.varPseudos[pseudoKey]) {
        target.varPseudos[pseudoKey]![k] = source.varPseudos[pseudoKey][k];
      }
    }
  }

  // rootVars
  if (source.rootVars) {
    if (!target.rootVars) {
      target.rootVars = {};
    }
    for (const rv in source.rootVars) {
      target.rootVars[rv] = source.rootVars[rv];
    }
  }
}

/* -------------------------------------------------------------------------
   Section H: parseDirectives(text)
   - หา @const name {...}
   - หา directive top-level (@scope, @bind) ยกเว้น @use, @query
   - parse .className { ... }
   ------------------------------------------------------------------------- */
function parseDirectives(text: string): {
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

function parseClassBlocksWithBraceCounting(text: string): IClassBlock[] {
  const result: IClassBlock[] = [];

  // regex จับชื่อ class => .<className>{
  // แล้วใช้ brace counting เพื่อหา "}" ที่แท้จริง
  const pattern = /\.([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const className = match[1];
    // ตำแหน่งหลัง {
    const startIndex = pattern.lastIndex;
    let braceCount = 1;
    let i = startIndex;
    for (; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
      }
      if (braceCount === 0) {
        // เจอจุดปิด block แล้ว
        break;
      }
    }
    // i คือ index ของ '}' สุดท้าย
    const body = text.slice(startIndex, i).trim();

    result.push({
      className,
      body,
    });
  }

  return result;
}

/* -------------------------------------------------------------------------
   Section I: processClassBlocks => handle @use, extractQueryBlocks, parse lines ...
   ------------------------------------------------------------------------- */
function processClassBlocks(
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

/* -------------------------------------------------------------------------
   Section J: handleBindDirectives
   - ถ้าต้องการรวมชื่อ class => @bind main .box .grid ...
   ------------------------------------------------------------------------- */
function handleBindDirectives(
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

/* -------------------------------------------------------------------------
   Section K: transformVariables + transformLocalVariables
   - ตัดเรื่อง dev/prod
   ------------------------------------------------------------------------- */
export function transFormVariables(
  styleDef: IStyleDefinition,
  scopeName: string,
  className: string
): void {
  // helper สร้าง prefix
  const scopePart = scopeName === 'none' ? className : `${scopeName}_${className}`;
  // -----------------------------
  // 1) Base variables (varBase)
  // -----------------------------
  if (styleDef.varBase) {
    for (const varName in styleDef.varBase) {
      const rawValue = styleDef.varBase[varName];

      // finalVarName => "--varName-scopePart"
      const finalVarName = `--${varName}-${scopePart}`;

      // ใส่ลง rootVars
      styleDef.rootVars = styleDef.rootVars || {};
      styleDef.rootVars[finalVarName] = rawValue;

      // replace var(--varName) => var(--varName-scopePart) ใน base
      for (const cssProp in styleDef.base) {
        styleDef.base[cssProp] = styleDef.base[cssProp].replace(
          `var(--${varName})`,
          `var(${finalVarName})`
        );
      }
    }
  }

  // -----------------------------
  // 2) State variables (varStates)
  // -----------------------------
  if (styleDef.varStates) {
    for (const stName in styleDef.varStates) {
      const varsOfThatState: Record<string, string> = styleDef.varStates[stName] || {};
      for (const varName in varsOfThatState) {
        const rawValue = varsOfThatState[varName];

        // "--varName-scopePart-stateName"
        const finalVarName = `--${varName}-${scopePart}-${stName}`;

        styleDef.rootVars = styleDef.rootVars || {};
        styleDef.rootVars[finalVarName] = rawValue;

        // replace var(--varName-state) => var(--varName-scopePart-state)
        const stateProps = styleDef.states[stName];
        if (stateProps) {
          for (const cssProp in stateProps) {
            stateProps[cssProp] = stateProps[cssProp].replace(
              `var(--${varName}-${stName})`,
              `var(${finalVarName})`
            );
          }
        }
      }
    }
  }

  // ------------------------------------------------------
  // 3) Pseudo variables
  // ------------------------------------------------------
  if (styleDef.varPseudos) {
    for (const pseudoName in styleDef.varPseudos) {
      const pseudoVars: Record<string, string> = styleDef.varPseudos[pseudoName] || {};
      for (const varName in pseudoVars) {
        const rawValue = pseudoVars[varName];
        // "--varName-scopePart-pseudoName"
        const finalVarName = `--${varName}-${scopePart}-${pseudoName}`;

        styleDef.rootVars = styleDef.rootVars || {};
        styleDef.rootVars[finalVarName] = rawValue;

        const pseudoProps = styleDef.pseudos[pseudoName];
        if (pseudoProps) {
          for (const cssProp in pseudoProps) {
            pseudoProps[cssProp] = pseudoProps[cssProp].replace(
              `var(--${varName}-${pseudoName})`,
              `var(${finalVarName})`
            );
          }
        }
      }
    }
  }
}

function transformLocalVariables(
  styleDef: IStyleDefinition,
  scopeName: string,
  className: string
): void {
  if (!styleDef.localVars) {
    return;
  }

  // ถ้า scopeName==='none' => ใช้ className เฉย ๆ, ไม่ใส่ 'none_'
  const scopePart = scopeName === 'none' ? className : `${scopeName}_${className}`;

  // สร้าง map property
  const localVarProps: Record<string, string> = {};

  for (const varName in styleDef.localVars) {
    const rawVal = styleDef.localVars[varName];
    // ตัวแปรสุดท้าย => `--${varName}-${scopePart}`
    const finalVarName = `--${varName}-${scopePart}`;
    localVarProps[finalVarName] = rawVal;
  }

  // REGEX ไว้ replace LOCALVAR(xxx) => var(--xxx-scopePart)
  const placeholderRegex = /LOCALVAR\(([\w-]+)\)/g;
  const replacer = (match: string, p1: string): string => {
    const finalVarName = `--${p1}-${scopePart}`;
    return `var(${finalVarName})`;
  };

  // replace ใน base
  for (const prop in styleDef.base) {
    styleDef.base[prop] = styleDef.base[prop].replace(placeholderRegex, replacer);
  }

  // states
  for (const stName in styleDef.states) {
    for (const prop in styleDef.states[stName]) {
      styleDef.states[stName][prop] = styleDef.states[stName][prop].replace(
        placeholderRegex,
        replacer
      );
    }
  }

  // pseudos
  for (const pseudoName in styleDef.pseudos) {
    const obj = styleDef.pseudos[pseudoName];
    if (!obj) continue;
    for (const prop in obj) {
      obj[prop] = obj[prop].replace(placeholderRegex, replacer);
    }
  }

  // screens
  for (const scr of styleDef.screens) {
    for (const prop in scr.props) {
      scr.props[prop] = scr.props[prop].replace(placeholderRegex, replacer);
    }
  }

  // containers
  for (const ctnr of styleDef.containers) {
    for (const prop in ctnr.props) {
      ctnr.props[prop] = ctnr.props[prop].replace(placeholderRegex, replacer);
    }
  }

  // เก็บ mapping localVar => finalVarName ไว้ใน styleDef._resolvedLocalVars
  (styleDef as any)._resolvedLocalVars = localVarProps;
}

/* -------------------------------------------------------------------------
   Section L: buildCssText
   ------------------------------------------------------------------------- */
function buildCssText(displayName: string, styleDef: IStyleDefinition): string {
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
function buildQueryCssText(
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

/* -------------------------------------------------------------------------
   Section M: ฟังก์ชันหลัก generateSwdCssFromSource
   ------------------------------------------------------------------------- */
function generateSwdCssFromSource(sourceText: string): string {
  // 1) parseDirectives
  const { directives, classBlocks, constBlocks } = parseDirectives(sourceText);

  // 2) หา scope (@scope)
  const scopeDir = directives.find((d) => d.name === 'scope');
  if (!scopeDir) {
    throw new Error(`[SWD-ERR] You must provide "@scope <name>" in styled(...) block.`);
  }
  const scopeName = scopeDir.value;

  // 3) ensureScopeUnique(scopeName)
  ensureScopeUnique(scopeName);

  // 4) สร้าง map const => partial styleDef
  const constMap = new Map<string, IStyleDefinition>();
  for (const c of constBlocks) {
    constMap.set(c.name, c.styleDef);
  }

  // 5) processClassBlocks => ได้ map<finalKey, styleDef>
  const classNameDefs = processClassBlocks(scopeName, classBlocks, constMap);

  // 6) handleBindDirectives
  handleBindDirectives(scopeName, directives, classNameDefs);

  // 7) loop => transformVariables + transformLocalVariables => buildCss
  let finalCss = '';
  for (const [displayKey, styleDef] of classNameDefs.entries()) {
    const className = displayKey.replace(`${scopeName}_`, ''); // pure class name
    transFormVariables(styleDef, scopeName, className);
    transformLocalVariables(styleDef, scopeName, className);
    finalCss += buildCssText(displayKey, styleDef);
  }

  return finalCss;
}

/* -------------------------------------------------------------------------
   Section N: ฟังก์ชันหลัก createSwdCssFile(doc)
   - command สำหรับ extension
   ------------------------------------------------------------------------- */
export async function createSwdCssFile(doc: vscode.TextDocument) {
  // 1) ตรวจไฟล์ .swd.ts
  if (!doc.fileName.endsWith('.swd.ts')) {
    return;
  }

  // 2) basename => "xxx.swd.ts" => "xxx"
  const fileName = path.basename(doc.fileName); // ex. "app.swd.ts"
  const base = fileName.replace(/\.swd\.ts$/, ''); // -> "app"

  // 3) สร้างไฟล์ .swd.css ข้าง ๆ
  const currentDir = path.dirname(doc.fileName);
  const newCssFilePath = path.join(currentDir, base + '.swd.css');

  if (!fs.existsSync(newCssFilePath)) {
    fs.writeFileSync(newCssFilePath, '', 'utf8');
  }

  // 4) ใส่ import "./xxx.swd.css"
  const relImport = `./${base}.swd.css`;
  const importLine = `import '${relImport}';\n`;

  // ลบ import เดิม
  const sanitizedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldRegex = new RegExp(
    `^import\\s+["'][^"']*${sanitizedBase}\\.swd\\.css["'];?\\s*(?:\\r?\\n)?`,
    'm'
  );
  const fullText = doc.getText();
  let newText = fullText.replace(oldRegex, '');
  newText = newText.replace(/\n{2,}/g, '\n');

  // prepend import line
  const finalText = importLine + newText;

  // replace doc
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    new vscode.Position(0, 0),
    doc.lineAt(doc.lineCount - 1).range.end
  );
  edit.replace(doc.uri, fullRange, finalText);
  await vscode.workspace.applyEdit(edit);

  // 5) parse => generate
  const sourceText = finalText.replace(importLine, '');
  let generatedCss = '';
  try {
    generatedCss = generateSwdCssFromSource(sourceText);
  } catch (e: any) {
    vscode.window.showErrorMessage(`Styledwind parse error: ${e.message}`);
  }

  // 6) เขียนไฟล์ .swd.css
  fs.writeFileSync(newCssFilePath, generatedCss, 'utf8');

  // // 7) notify
  // vscode.window.showInformationMessage(`Generated CSS to "${base}.swd.css" done!`);
}
