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

function buildVariableName(
  baseVarName: string,
  scope: string,
  cls: string,
  suffix: string
): string {
  // ถ้าไม่มี suffix => --bg-scope_cls
  // ถ้ามี suffix => --bg-scope_cls-hover
  if (!suffix) {
    return `--${baseVarName}-${scope}_${cls}`;
  }
  return `--${baseVarName}-${scope}_${cls}-${suffix}`;
}

/* -------------------------------------------------------------------------
   Section E: parseSingleAbbr - parse base/state/pseudo/... + !important checks
   ------------------------------------------------------------------------- */

/** parseBaseStyle **/
function parseBaseStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean,
  isQueryBlock: boolean
) {
  const { line: abbrLineNoBang, isImportant } = detectImportantSuffix(abbrLine);
  if (isConstContext && isImportant) {
    throw new Error(`[SWD-ERR] !important not allowed in @const/theme.define block. "${abbrLine}"`);
  }

  const [styleAbbr, propValue] = separateStyleAndProperties(abbrLineNoBang);
  if (!styleAbbr) return;

  // ถ้าเป็น local var (--&xxx)
  if (styleAbbr.startsWith('--&')) {
    if (isConstContext) {
      throw new Error(`[SWD-ERR] Local var "${styleAbbr}" not allowed inside @const block.`);
    }
    if (isQueryBlock) {
      throw new Error(`[SWD-ERR] Local var "${styleAbbr}" not allowed inside @query block.`);
    }
    if (isImportant) {
      throw new Error(`[SWD-ERR] !important is not allowed with local var "${styleAbbr}".`);
    }

    const localVarName = styleAbbr.slice(3);
    if (!styleDef.localVars) {
      styleDef.localVars = {};
    }
    if (styleDef.localVars[localVarName] != null) {
      throw new Error(`[SWD-ERR] local var "${localVarName}" is already declared in this class.`);
    }
    styleDef.localVars[localVarName] = convertCSSVariable(propValue);
    return;
  }

  // ถ้าเป็น $variable?
  const isVariable = styleAbbr.startsWith('$');
  const realAbbr = isVariable ? styleAbbr.slice(1) : styleAbbr;

  if (isVariable && isQueryBlock) {
    throw new Error(`[SWD-ERR] $variable not allowed inside @query block. Found: "${abbrLine}"`);
  }

  // ถ้าทั้ง abbrMap และ globalDefineMap ก็ต้องตรวจไม่ conflict
  // (ตัวอย่างนี้อาจข้าม หรือ implement ถ้าต้องการ)

  // ลอง check abbrMap
  const expansions = [`${realAbbr}[${propValue}]`];
  if (isVariable && isQueryBlock) {
    throw new Error(`[SWD-ERR] $variable ("${styleAbbr}") not allowed inside @query block.`);
  }

  for (const ex of expansions) {
    const [abbr2, val2] = separateStyleAndProperties(ex);
    if (!abbr2) continue;

    const cssProp = abbrMap[abbr2 as keyof typeof abbrMap];
    if (!cssProp) {
      throw new Error(`"${abbr2}" not defined in abbrMap. (abbrLine=${abbrLine})`);
    }
    const finalVal = convertCSSVariable(val2);

    if (isVariable) {
      if (val2.startsWith('--&')) {
        throw new Error(
          `[SWD-ERR] Local var (--&xxx) is not allowed inside $variable usage. Got "${val2}"`
        );
      }
      if (!styleDef.varBase) {
        styleDef.varBase = {};
      }
      styleDef.varBase[realAbbr] = finalVal;

      styleDef.base[cssProp] = `var(--${realAbbr})${isImportant ? ' !important' : ''}`;
    } else {
      // replace '--&' if exist
      if (val2.includes('--&')) {
        const replaced = val2.replace(/--&([\w-]+)/g, (_, varName) => {
          return `LOCALVAR(${varName})`;
        });
        styleDef.base[cssProp] = replaced + (isImportant ? ' !important' : '');
      } else {
        styleDef.base[cssProp] = finalVal + (isImportant ? ' !important' : '');
      }
    }
  }
}

/** parseStateStyle - ex. hover(bg[red]) **/
function parseStateStyle(abbrLine: string, styleDef: IStyleDefinition, isConstContext: boolean) {
  const openParenIdx = abbrLine.indexOf('(');
  const stateName = abbrLine.slice(0, openParenIdx).trim();
  const inside = abbrLine.slice(openParenIdx + 1, -1).trim();

  if (!styleDef.states[stateName]) {
    styleDef.states[stateName] = {};
  }
  const resultObj = styleDef.states[stateName]!;

  const propsInState = inside.split(/ (?=[^\[\]]*(?:\[|$))/);
  for (const p of propsInState) {
    const { line: tokenNoBang, isImportant } = detectImportantSuffix(p);
    if (isConstContext && isImportant) {
      throw new Error(`[SWD-ERR] !important not allowed in @const block (state). "${abbrLine}"`);
    }
    const [abbr, val] = separateStyleAndProperties(tokenNoBang);
    if (!abbr) continue;

    if (abbr.startsWith('--&') && isImportant) {
      throw new Error(
        `[SWD-ERR] !important not allowed with local var (${abbr}) in state ${stateName}.`
      );
    }

    // check $variable?
    if (abbr.startsWith('$')) {
      // parse suffix
      const { baseVarName, suffix } = parseVariableAbbr(abbr);
      if (!styleDef.varStates) {
        styleDef.varStates = {};
      }
      if (!styleDef.varStates[stateName]) {
        styleDef.varStates[stateName] = {};
      }
      const combinedKey = suffix ? `${baseVarName}-${suffix}` : baseVarName;
      styleDef.varStates[stateName]![combinedKey] = convertCSSVariable(val);
      // สมมติ abbrMap[ baseVarName+suffix ] => background-color ...
      // (ตัวอย่าง simplfy)
      // ... (หรือ parse expansions)
      // * simplified version
      resultObj['color'] = `var(--${combinedKey}-${stateName})${isImportant ? ' !important' : ''}`;
      // NOTE: ของจริงควร map abbr => cssProp
      // (ทำแบบ parseBaseStyle)
      // * Example simplified
    } else {
      // normal abbr
      const expansions = [`${abbr}[${val}]`];
      for (const ex of expansions) {
        const [abbr2, val2] = separateStyleAndProperties(ex);
        if (!abbr2) continue;
        const cssProp = (abbrMap as any)[abbr2];
        if (!cssProp) {
          throw new Error(`[SWD-ERR] abbr "${abbr2}" not found in abbrMap (state=${stateName}).`);
        }
        let replacedVal = convertCSSVariable(val2);
        if (val2.includes('--&')) {
          replacedVal = val2.replace(/--&([\w-]+)/g, (_, varName) => `LOCALVAR(${varName})`);
        }
        resultObj[cssProp] = replacedVal + (isImportant ? ' !important' : '');
      }
    }
  }
}

/** parsePseudoElementStyle - ex. before(bg[red]) **/
function parsePseudoElementStyle(
  abbrLine: string,
  styleDef: IStyleDefinition,
  isConstContext: boolean
) {
  const openParenIdx = abbrLine.indexOf('(');
  const pseudoName = abbrLine.slice(0, openParenIdx).trim();
  const inside = abbrLine.slice(openParenIdx + 1, -1).trim();

  if (!styleDef.pseudos[pseudoName]) {
    styleDef.pseudos[pseudoName] = {};
  }
  const resultObj = styleDef.pseudos[pseudoName]!;

  // รองรับ varPseudos
  if (!styleDef.varPseudos) {
    styleDef.varPseudos = {};
  }
  if (!styleDef.varPseudos[pseudoName]) {
    styleDef.varPseudos[pseudoName] = {};
  }

  const propsInPseudo = inside.split(/ (?=[^\[\]]*(?:\[|$))/);
  for (const p of propsInPseudo) {
    const { line: tokenNoBang, isImportant } = detectImportantSuffix(p);
    if (isConstContext && isImportant) {
      throw new Error(`[SWD-ERR] !important not allowed in @const block. (pseudo=${pseudoName})`);
    }
    const [abbr, val] = separateStyleAndProperties(tokenNoBang);
    if (!abbr) continue;

    if (abbr.startsWith('--&') && isImportant) {
      throw new Error(`[SWD-ERR] !important not allowed with local var in pseudo ${pseudoName}.`);
    }

    // ถ้า abbr === 'ct' => content
    if (abbr === 'ct') {
      resultObj['content'] = `"${val}"` + (isImportant ? ' !important' : '');
      continue;
    }

    // check $variable?
    if (abbr.startsWith('$')) {
      const { baseVarName, suffix } = parseVariableAbbr(abbr);
      const combinedKey = suffix ? `${baseVarName}-${suffix}` : baseVarName;
      styleDef.varPseudos[pseudoName]![combinedKey] = convertCSSVariable(val);
      // สมมติ mapping abbr => cssProp
      // simplified => resultObj["color"] = ...
      resultObj['color'] = `var(--${combinedKey}-${pseudoName})${isImportant ? ' !important' : ''}`;
    } else {
      // normal
      const expansions = [`${abbr}[${val}]`];
      for (const ex of expansions) {
        const [abbr2, val2] = separateStyleAndProperties(ex);
        if (!abbr2) continue;
        const cssProp = (abbrMap as any)[abbr2];
        if (!cssProp) {
          throw new Error(`[SWD-ERR] abbr "${abbr2}" not found in abbrMap (pseudo=${pseudoName}).`);
        }
        let replacedVal = convertCSSVariable(val2);
        if (val2.includes('--&')) {
          replacedVal = val2.replace(/--&([\w-]+)/g, (_, v) => `LOCALVAR(${v})`);
        }
        resultObj[cssProp] = replacedVal + (isImportant ? ' !important' : '');
      }
    }
  }
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
  for (const prop in source.base) {
    target.base[prop] = source.base[prop];
  }
  for (const st in source.states) {
    if (!target.states[st]) {
      target.states[st] = {};
    }
    for (const p in source.states[st]) {
      target.states[st][p] = source.states[st][p];
    }
  }
  for (const s of source.screens) {
    target.screens.push({ query: s.query, props: { ...s.props } });
  }
  for (const c of source.containers) {
    target.containers.push({ query: c.query, props: { ...c.props } });
  }
  for (const pName in source.pseudos) {
    if (!target.pseudos[pName]) {
      target.pseudos[pName] = {};
    }
    const fromPseudo = source.pseudos[pName]!;
    for (const prop in fromPseudo) {
      target.pseudos[pName]![prop] = fromPseudo[prop];
    }
  }
  if (source.varBase) {
    if (!target.varBase) target.varBase = {};
    for (const k in source.varBase) {
      target.varBase[k] = source.varBase[k];
    }
  }
  if (source.varStates) {
    if (!target.varStates) target.varStates = {};
    for (const stName in source.varStates) {
      if (!target.varStates[stName]) {
        target.varStates[stName] = {};
      }
      for (const k in source.varStates[stName]) {
        target.varStates[stName]![k] = source.varStates[stName]![k];
      }
    }
  }
  if (source.varPseudos) {
    if (!target.varPseudos) target.varPseudos = {};
    for (const pseudoKey in source.varPseudos) {
      if (!target.varPseudos[pseudoKey]) {
        target.varPseudos[pseudoKey] = {};
      }
      for (const k in source.varPseudos[pseudoKey]) {
        target.varPseudos[pseudoKey]![k] = source.varPseudos[pseudoKey]![k];
      }
    }
  }
  if (source.rootVars) {
    if (!target.rootVars) target.rootVars = {};
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
  const pattern = /\.([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const className = match[1];
    const startIndex = pattern.lastIndex;
    let braceCount = 1;
    let i = startIndex;
    for (; i < text.length; i++) {
      if (text[i] === '{') braceCount++;
      else if (text[i] === '}') braceCount--;
      if (braceCount === 0) {
        break;
      }
    }
    const body = text.slice(startIndex, i).trim();
    result.push({ className, body });
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
  const result = new Map<string, IStyleDefinition>();

  for (const block of classBlocks) {
    const clsName = block.className;

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
    // merge const
    for (const cName of usedConstNames) {
      if (!constMap.has(cName)) {
        throw new Error(`[SWD-ERR] @use unknown const "${cName}".`);
      }
      mergeStyleDef(classStyleDef, constMap.get(cName)!);
    }
    // parse normal lines
    for (const l of normalLines) {
      parseSingleAbbr(l, classStyleDef, false, false);
    }

    // (C) parse ใน query blocks
    for (let i = 0; i < realQueryBlocks.length; i++) {
      const qBlock = realQueryBlocks[i];
      const qRawBody = queries[i].rawBody;
      const qLines = qRawBody
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let usedConstNamesQ: string[] = [];
      const normalQLines: string[] = [];
      for (const qLn of qLines) {
        if (qLn.startsWith('@use ')) {
          usedConstNamesQ.push(...qLn.replace('@use', '').trim().split(/\s+/));
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
      const refs = tokens.slice(1); // e.g. [".box", ".grid"]

      // ตรวจว่า refs => ".box" => finalKey => "scope_box"
      // วิธีแก้:
      // 1) parse => clsName="box" => finalKey = scopeName==='none'? "box" : "scope_box"
      //    => แล้วเช็คว่า classMap.has( finalKey )
      const classNames: string[] = [];
      for (const ref of refs) {
        if (!ref.startsWith('.')) {
          throw new Error(`[SWD-ERR] @bind usage must reference classes with a dot. got "${ref}"`);
        }
        const shortCls = ref.slice(1);
        const finalKey = scopeName === 'none' ? shortCls : `${scopeName}_${shortCls}`;
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
function transFormVariables(styleDef: IStyleDefinition, scopeName: string, classKey: string) {
  // scopePart
  // ถ้า scopeName==='none' => classKey (อาจเป็น "box")
  // ถ้า scopeName!=='none' => classKey จะเป็น "scope_box"
  // => สรุปใช้ classKey ตรงๆ ก็ได้
  const scopePart = classKey;

  // varBase
  if (styleDef.varBase) {
    for (const varName in styleDef.varBase) {
      // varName อาจเป็น "bg" หรือ "bg-hover"
      const rawVal = styleDef.varBase[varName];
      const finalVarName = `--${varName}-${scopePart}`;
      styleDef.rootVars = styleDef.rootVars || {};
      styleDef.rootVars[finalVarName] = rawVal;

      // replace var(--bg-hover) => var(--bg-hover-scopePart) ใน base
      for (const p in styleDef.base) {
        styleDef.base[p] = styleDef.base[p].replace(
          new RegExp(`var\\(--${varName}\\)`, 'g'),
          `var(${finalVarName})`
        );
      }
    }
  }

  // varStates
  if (styleDef.varStates) {
    for (const stName in styleDef.varStates) {
      // @ts-ignore
      const varObj = styleDef.varStates[stName];
      // @ts-ignore
      for (const varName in varObj) {
        const rawVal = varObj[varName];
        const finalVarName = `--${varName}-${scopePart}-${stName}`;
        styleDef.rootVars = styleDef.rootVars || {};
        styleDef.rootVars[finalVarName] = rawVal;
        const stProps = styleDef.states[stName];
        if (stProps) {
          for (const cssProp in stProps) {
            stProps[cssProp] = stProps[cssProp].replace(
              new RegExp(`var\\(--${varName}-${stName}\\)`, 'g'),
              `var(${finalVarName})`
            );
          }
        }
      }
    }
  }

  // varPseudos
  if (styleDef.varPseudos) {
    for (const pseudoName in styleDef.varPseudos) {
      // @ts-ignore
      const varObj = styleDef.varPseudos[pseudoName]!;
      // @ts-ignore
      for (const varName in varObj) {
        const rawVal = varObj[varName];
        const finalVarName = `--${varName}-${scopePart}-${pseudoName}`;
        styleDef.rootVars = styleDef.rootVars || {};
        styleDef.rootVars[finalVarName] = rawVal;

        const pseudoObj = styleDef.pseudos[pseudoName];
        if (pseudoObj) {
          for (const cssProp in pseudoObj) {
            pseudoObj[cssProp] = pseudoObj[cssProp].replace(
              new RegExp(`var\\(--${varName}-${pseudoName}\\)`, 'g'),
              `var(${finalVarName})`
            );
          }
        }
      }
    }
  }
}

function transformLocalVariables(styleDef: IStyleDefinition, classKey: string) {
  if (!styleDef.localVars) return;
  const localVarProps: Record<string, string> = {};
  for (const varName in styleDef.localVars) {
    const rawVal = styleDef.localVars[varName];
    const finalVarName = `--${varName}-${classKey}`;
    localVarProps[finalVarName] = rawVal;
  }
  const placeholderRegex = /LOCALVAR\(([\w-]+)\)/g;
  const replacer = (match: string, p1: string) => {
    return `var(--${p1}-${classKey})`;
  };

  // replace in base
  for (const p in styleDef.base) {
    styleDef.base[p] = styleDef.base[p].replace(placeholderRegex, replacer);
  }
  // states
  for (const st in styleDef.states) {
    for (const p in styleDef.states[st]) {
      styleDef.states[st][p] = styleDef.states[st][p].replace(placeholderRegex, replacer);
    }
  }
  // pseudos
  for (const pseudo in styleDef.pseudos) {
    const obj = styleDef.pseudos[pseudo];
    if (!obj) continue;
    for (const p in obj) {
      obj[p] = obj[p].replace(placeholderRegex, replacer);
    }
  }
  // screens
  for (const s of styleDef.screens) {
    for (const p in s.props) {
      s.props[p] = s.props[p].replace(placeholderRegex, replacer);
    }
  }
  // containers
  for (const c of styleDef.containers) {
    for (const p in c.props) {
      c.props[p] = c.props[p].replace(placeholderRegex, replacer);
    }
  }

  // queries
  if (styleDef.queries) {
    for (const q of styleDef.queries) {
      for (const p in q.styleDef.base) {
        q.styleDef.base[p] = q.styleDef.base[p].replace(placeholderRegex, replacer);
      }
      for (const st in q.styleDef.states) {
        for (const p in q.styleDef.states[st]) {
          q.styleDef.states[st][p] = q.styleDef.states[st][p].replace(placeholderRegex, replacer);
        }
      }
      // ... similarly for pseudos, screens, containers
      // (ถ้าต้องการ handle localVar ใน query)
    }
  }

  // เก็บลง styleDef._resolvedLocalVars
  (styleDef as any)._resolvedLocalVars = localVarProps;
}

/* -------------------------------------------------------------------------
   Section L: buildCssText
   ------------------------------------------------------------------------- */
function buildCssText(displayName: string, styleDef: IStyleDefinition): string {
  let cssText = '';

  // 1) rootVars => :root{...}
  if (styleDef.rootVars) {
    let varBlock = '';
    for (const varName in styleDef.rootVars) {
      varBlock += `${varName}:${styleDef.rootVars[varName]};`;
    }
    if (varBlock) {
      cssText += `:root{${varBlock}}`;
    }
  }

  // 2) base + local var
  let baseProps = '';
  const localVars = (styleDef as any)._resolvedLocalVars as Record<string, string> | undefined;
  if (localVars) {
    for (const lvName in localVars) {
      baseProps += `${lvName}:${localVars[lvName]};`;
    }
  }
  for (const p in styleDef.base) {
    baseProps += `${p}:${styleDef.base[p]};`;
  }
  if (baseProps) {
    cssText += `.${displayName}{${baseProps}}`;
  }

  // 3) states
  for (const st in styleDef.states) {
    const obj = styleDef.states[st];
    let props = '';
    for (const p in obj) {
      props += `${p}:${obj[p]};`;
    }
    cssText += `.${displayName}:${st}{${props}}`;
  }

  // 4) screens
  for (const sc of styleDef.screens) {
    let props = '';
    for (const p in sc.props) {
      props += `${p}:${sc.props[p]};`;
    }
    cssText += `@media only screen and ${sc.query}{.${displayName}{${props}}}`;
  }

  // 5) containers
  for (const c of styleDef.containers) {
    let props = '';
    for (const p in c.props) {
      props += `${p}:${c.props[p]};`;
    }
    cssText += `@container ${c.query}{.${displayName}{${props}}}`;
  }

  // 6) pseudos
  for (const pseudo in styleDef.pseudos) {
    const obj = styleDef.pseudos[pseudo];
    if (!obj) continue;
    let props = '';
    for (const p in obj) {
      props += `${p}:${obj[p]};`;
    }
    cssText += `.${displayName}::${pseudo}{${props}}`;
  }

  // 7) queries (nested @query)
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

  // base
  let baseProps = '';
  const localVars = (qDef as any)._resolvedLocalVars as Record<string, string> | undefined;
  if (localVars) {
    for (const lvName in localVars) {
      baseProps += `${lvName}:${localVars[lvName]};`;
    }
  }
  for (const p in qDef.base) {
    baseProps += `${p}:${qDef.base[p]};`;
  }
  if (baseProps) {
    out += `.${parentDisplayName} ${selector}{${baseProps}}`;
  }

  // states
  for (const st in qDef.states) {
    let props = '';
    for (const pp in qDef.states[st]) {
      props += `${pp}:${qDef.states[st][pp]};`;
    }
    out += `.${parentDisplayName} ${selector}:${st}{${props}}`;
  }

  // screens
  for (const sc of qDef.screens) {
    let props = '';
    for (const p in sc.props) {
      props += `${p}:${sc.props[p]};`;
    }
    out += `@media only screen and ${sc.query}{.${parentDisplayName} ${selector}{${props}}}`;
  }

  // containers
  for (const c of qDef.containers) {
    let props = '';
    for (const p in c.props) {
      props += `${p}:${c.props[p]};`;
    }
    out += `@container ${c.query}{.${parentDisplayName} ${selector}{${props}}}`;
  }

  // pseudos
  for (const pseudo in qDef.pseudos) {
    const obj = qDef.pseudos[pseudo];
    if (!obj) continue;
    let props = '';
    for (const pp in obj) {
      props += `${pp}:${obj[pp]};`;
    }
    out += `.${parentDisplayName} ${selector}::${pseudo}{${props}}`;
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
    transFormVariables(styleDef, scopeName, displayKey);
    transformLocalVariables(styleDef, displayKey);
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
