// hoverProvider.ts
import * as vscode from 'vscode';
import { abbrMap } from './constants';

/**
 * IClassBlock, IHoverInfo
 * เก็บข้อมูลสไตล์ของ .class + mapping line => hover
 */
interface IClassBlock {
  base: Record<string, string>;
  states: Record<string, Record<string, string>>;
  screens?: Array<{ query: string; props: Record<string, string> }>;
  container?: Array<{ query: string; props: Record<string, string> }>;
  pseudoBefore?: Record<string, string>;
  pseudoAfter?: Record<string, string>;
  linesMap: Record<string, IHoverInfo>;
}

interface IHoverInfo {
  type: 'base' | 'state' | 'screen' | 'container' | 'before' | 'after';
  stateName?: string;
  className: string;
  rawLine: string;
  query?: string;
  props?: Record<string, string>;
}

/** แปลง --xxx => var(--xxx) */
function convertCSSVariable(val: string): string {
  return val.replace(/(--[\w-]+)/g, 'var($1)');
}

/** "sm" => "max-w[700px]" => "(max-width:700px)" */
function convertScreenOrBreakpoint(token: string, screenDict: Record<string, string>): string {
  if (screenDict[token]) {
    token = screenDict[token];
  }
  const m = /^(max|min)-w\[(\d+px)\]$/.exec(token);
  if (!m) return '';
  return `(${m[1]}-width: ${m[2]})`;
}

/**
 * parseBlocksExtended
 * แยก .classname { ... } ออกเป็น IClassBlock (base, states, screens, container, pseudoBefore/After)
 * พร้อม linesMap สำหรับ line => IHoverInfo
 */
function parseBlocksExtended(
  docText: string,
  screenDict: Record<string, string>
): Record<string, IClassBlock> {
  const result: Record<string, IClassBlock> = {};
  const blockRegex = /\.([\w-]+)\s*\{([^}]+)\}/g;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(docText)) !== null) {
    const className = '.' + match[1];
    const inside = match[2].trim();
    const lines = inside
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const block: IClassBlock = {
      base: {},
      states: {},
      linesMap: {},
    };

    for (const line of lines) {
      // 1) base e.g. c[yellow], bg[--blue-100]
      let m = /^(\w+)\[([^\]]+)\]$/.exec(line);
      if (m) {
        const ab = m[1];
        let val = m[2];
        val = convertCSSVariable(val);
        const cssProp = abbrMap[ab];
        if (cssProp) {
          block.base[cssProp] = val;
        }
        block.linesMap[line] = {
          type: 'base',
          className,
          rawLine: line,
          props: { [cssProp || '']: val },
        };
        continue;
      }

      // 2) states: hover|active|focus|focus-visible|focus-within
      const stateRegex = /^(hover|active|focus|focus-visible|focus-within)\(.+\)$/;
      if (stateRegex.test(line)) {
        const mm = stateRegex.exec(line);
        if (mm) {
          const stName = mm[1];
          const inner = line.replace(new RegExp(`^${stName}\\(|\\)$`, 'g'), '').trim();
          const splitted = inner.split(/\s+/);
          const props: Record<string, string> = {};
          for (const sp of splitted) {
            const mm2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
            if (mm2) {
              const ab = mm2[1];
              let val = mm2[2];
              val = convertCSSVariable(val);
              const cssProp = abbrMap[ab];
              if (cssProp) props[cssProp] = val;
            }
          }
          block.states[stName] = props;
          block.linesMap[line] = {
            type: 'state',
            stateName: stName,
            className,
            rawLine: line,
            props,
          };
          continue;
        }
      }

      // 3) screen(...)
      if (/^screen\(.+\)$/.test(line)) {
        if (!block.screens) block.screens = [];
        const inner = line.replace(/^screen\(|\)$/g, '').trim();
        const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
        if (!queryPart || !stylePart) continue;

        const mediaQuery = convertScreenOrBreakpoint(queryPart, screenDict);
        if (!mediaQuery) continue;

        const splitted = stylePart.split(/\s+/);
        const props: Record<string, string> = {};
        for (const sp of splitted) {
          const mm2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm2) {
            const ab = mm2[1];
            let val = mm2[2];
            val = convertCSSVariable(val);
            const cssProp = abbrMap[ab];
            if (cssProp) props[cssProp] = val;
          }
        }
        block.screens.push({ query: mediaQuery, props });
        block.linesMap[line] = {
          type: 'screen',
          className,
          rawLine: line,
          query: mediaQuery,
          props,
        };
        continue;
      }

      // 4) container(...)
      if (/^container\(.+\)$/.test(line)) {
        if (!block.container) block.container = [];
        const inner = line.replace(/^container\(|\)$/g, '').trim();
        const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
        if (!queryPart || !stylePart) continue;

        let containerQuery = convertScreenOrBreakpoint(queryPart, screenDict);
        const splitted = stylePart.split(/\s+/);
        const props: Record<string, string> = {};
        for (const sp of splitted) {
          const mm3 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm3) {
            const ab = mm3[1];
            let val = mm3[2];
            val = convertCSSVariable(val);
            const cssProp = abbrMap[ab];
            if (cssProp) props[cssProp] = val;
          }
        }
        block.container.push({ query: containerQuery, props });
        block.linesMap[line] = {
          type: 'container',
          className,
          rawLine: line,
          query: containerQuery,
          props,
        };
        continue;
      }

      // 5) before(...) / after(...)
      if (/^(before|after)\(.+\)$/.test(line)) {
        const isBefore = line.startsWith('before(');
        const isAfter = line.startsWith('after(');
        const inner = line.replace(/^(before|after)\(|\)$/g, '').trim();
        const splitted = inner.split(/\s+/);
        const props: Record<string, string> = {};
        for (const sp of splitted) {
          const mm4 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm4) {
            const ab = mm4[1];
            let val = mm4[2];
            val = convertCSSVariable(val);
            const cssProp = abbrMap[ab];
            if (cssProp) props[cssProp] = val;
          }
        }
        if (isBefore) block.pseudoBefore = props;
        if (isAfter) block.pseudoAfter = props;

        block.linesMap[line] = {
          type: isBefore ? 'before' : 'after',
          className,
          rawLine: line,
          props,
        };
      }
    }

    result[className] = block;
  }

  return result;
}

/** buildLineHover: สร้าง hover สำหรับ abbr[value], screen(...), container(...), etc. */
function buildLineHover(info: IHoverInfo): vscode.Hover {
  const { type, className, props, query, stateName } = info;

  switch (type) {
    case 'base': {
      if (!props) return new vscode.Hover('');
      const entries = Object.entries(props);
      if (!entries.length) return new vscode.Hover('');
      const [k, v] = entries[0]; // เช่น ["background-color","var(--blue-100)"]
      return new vscode.Hover({ language: 'css', value: `${k}: ${v};` });
    }
    case 'state': {
      // .box:hover {
      let lines = `${className}:${stateName} {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `  ${k}: ${props![k]};\n`;
      }
      lines += `}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'screen': {
      // @media only screen and (max-width:700px)
      let lines = `@media only screen and ${query} {\n  ${className} {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `    ${k}: ${props![k]};\n`;
      }
      lines += `  }\n}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'container': {
      // @container (max-width:700px)
      let lines = `@container ${query} {\n  ${className} {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `    ${k}: ${props![k]};\n`;
      }
      lines += `  }\n}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'before': {
      // .box::before {
      let lines = `${className}::before {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `  ${k}: ${props![k]};\n`;
      }
      lines += `}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'after': {
      let lines = `${className}::after {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `  ${k}: ${props![k]};\n`;
      }
      lines += `}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
  }
  return new vscode.Hover('');
}

/** buildClassHover: รวม base, states, screens, container, pseudo... + เว้นบรรทัด */
function buildClassHover(className: string, block: IClassBlock): vscode.Hover {
  let linesArr: string[] = [];

  // base
  {
    let tmp = `${className} {\n`;
    for (const k of Object.keys(block.base)) {
      tmp += `  ${k}: ${block.base[k]};\n`;
    }
    tmp += `}`;
    linesArr.push(tmp);
  }

  // states
  for (const stName of Object.keys(block.states)) {
    let tmp = `${className}:${stName} {\n`;
    const stProps = block.states[stName];
    for (const k of Object.keys(stProps)) {
      tmp += `  ${k}: ${stProps[k]};\n`;
    }
    tmp += `}`;
    linesArr.push(tmp);
  }

  // screens
  if (block.screens) {
    for (const sc of block.screens) {
      let tmp = `@media only screen and ${sc.query} {\n  ${className} {\n`;
      for (const k of Object.keys(sc.props)) {
        tmp += `    ${k}: ${sc.props[k]};\n`;
      }
      tmp += `  }\n}`;
      linesArr.push(tmp);
    }
  }

  // container
  if (block.container) {
    for (const c of block.container) {
      let tmp = `@container ${c.query} {\n  ${className} {\n`;
      for (const k of Object.keys(c.props)) {
        tmp += `    ${k}: ${c.props[k]};\n`;
      }
      tmp += `  }\n}`;
      linesArr.push(tmp);
    }
  }

  // before
  if (block.pseudoBefore) {
    let tmp = `${className}::before {\n`;
    for (const k of Object.keys(block.pseudoBefore)) {
      tmp += `  ${k}: ${block.pseudoBefore[k]};\n`;
    }
    tmp += `}`;
    linesArr.push(tmp);
  }
  // after
  if (block.pseudoAfter) {
    let tmp = `${className}::after {\n`;
    for (const k of Object.keys(block.pseudoAfter)) {
      tmp += `  ${k}: ${block.pseudoAfter[k]};\n`;
    }
    tmp += `}`;
    linesArr.push(tmp);
  }

  // join ด้วย "\n\n" เพื่อเว้นบรรทัดเปล่า
  const finalText = linesArr.join('\n\n');
  return new vscode.Hover({ language: 'css', value: finalText });
}

/** สร้าง HoverProvider เดียว (registerHoverProvider) */
export function createHoverProvider(screenDict: Record<string, string>) {
  return vscode.languages.registerHoverProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideHover(document, position) {
        if (!document.fileName.endsWith('.css.ts')) return;

        const docText = document.getText();
        const blocks = parseBlocksExtended(docText, screenDict);

        const range = document.getWordRangeAtPosition(
          position,
          /(\.\w+)|(hover\(.+\))|(active\(.+\))|(focus\(.+\))|(focus-visible\(.+\))|(focus-within\(.+\))|(screen\(.+\))|(container\(.+\))|((before|after)\(.+\))|(\w+\[[^\]]+\])/
        );
        if (!range) return;
        const hoveredText = document.getText(range);

        // หา line
        for (const className of Object.keys(blocks)) {
          const block = blocks[className];
          const lineInfo = block.linesMap[hoveredText];
          if (lineInfo) {
            return buildLineHover(lineInfo);
          }
        }

        // ถ้าชี้ ".box" => buildClassHover
        if (hoveredText.startsWith('.')) {
          const block = blocks[hoveredText];
          if (block) {
            return buildClassHover(hoveredText, block);
          }
        }

        return;
      },
    }
  );
}
