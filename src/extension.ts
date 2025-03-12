import * as vscode from 'vscode';
import * as fs from 'fs';
import { abbrMap, cssValues } from './constants';

/**
 * ข้อมูลโครงสร้างหนึ่งคลาส
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

/** parseThemePaletteFile */
function parseThemePaletteFile(themeFilePath: string): string[] {
  if (!fs.existsSync(themeFilePath)) return [];
  const content = fs.readFileSync(themeFilePath, 'utf8');
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) return [];

  const inside = match.groups.inside;
  const lines = inside.split('\n');
  const result: string[] = [];
  let skipFirstRow = true;

  for (let line of lines) {
    line = line.trim();
    if (!line.startsWith('[')) continue;
    if (skipFirstRow) {
      skipFirstRow = false;
      continue;
    }
    const rowMatch = /^\[\s*['"]([^'"]+)['"]/.exec(line);
    if (rowMatch) {
      const colorName = rowMatch[1];
      result.push(`--${colorName}`);
    }
  }
  return result;
}

/** parseThemeScreenDict */
function parseThemeScreenDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regScreens = /theme\.screen\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regScreens.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim();
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  for (const ln of lines) {
    const m2 = /^(\w+)\s*:\s*['"]([^'"]+)['"]/.exec(ln);
    if (m2) {
      dict[m2[1]] = m2[2];
    }
  }
  return dict;
}

/** ถ้าพบ "--xxx" -> "var(--xxx)" */
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

/** parseBlocksExtended */
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
      // base e.g. c[yellow]
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

      // states: hover|active|focus|focus-visible|focus-within
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

      // screen(...)
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

      // container(...)
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

      // before(...) / after(...)
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

/** buildLineHover: ใส่ ";" ต่อท้าย property */
function buildLineHover(info: IHoverInfo): vscode.Hover {
  const { type, className, props, query, stateName } = info;

  switch (type) {
    case 'base': {
      if (!props) return new vscode.Hover('');
      const entries = Object.entries(props);
      if (!entries.length) return new vscode.Hover('');
      // สมมติใส่เฉพาะอันแรก
      const [k, v] = entries[0];
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
      let lines = `@media only screen and ${query} {\n  ${className} {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `    ${k}: ${props![k]};\n`;
      }
      lines += `  }\n}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'container': {
      let lines = `@container ${query} {\n  ${className} {\n`;
      for (const k of Object.keys(props ?? {})) {
        lines += `    ${k}: ${props![k]};\n`;
      }
      lines += `  }\n}`;
      return new vscode.Hover({ language: 'css', value: lines });
    }
    case 'before': {
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

/** buildClassHover: ตอน hover .box => ใส่ ";" ท้าย property */
function buildClassHover(className: string, block: IClassBlock): vscode.Hover {
  let lines = `${className} {\n`;
  for (const k of Object.keys(block.base)) {
    lines += `  ${k}: ${block.base[k]};\n`;
  }
  lines += `}`;

  // states
  for (const stName of Object.keys(block.states)) {
    lines += `\n${className}:${stName} {\n`;
    const stProps = block.states[stName];
    for (const k of Object.keys(stProps)) {
      lines += `  ${k}: ${stProps[k]};\n`;
    }
    lines += `}`;
  }

  // screens
  if (block.screens) {
    for (const sc of block.screens) {
      lines += `\n@media only screen and ${sc.query} {\n  ${className} {\n`;
      for (const k of Object.keys(sc.props)) {
        lines += `    ${k}: ${sc.props[k]};\n`;
      }
      lines += `  }\n}`;
    }
  }

  // container
  if (block.container) {
    for (const c of block.container) {
      lines += `\n@container ${c.query} {\n  ${className} {\n`;
      for (const k of Object.keys(c.props)) {
        lines += `    ${k}: ${c.props[k]};\n`;
      }
      lines += `  }\n}`;
    }
  }

  // pseudoBefore
  if (block.pseudoBefore) {
    lines += `\n${className}::before {\n`;
    for (const k of Object.keys(block.pseudoBefore)) {
      lines += `  ${k}: ${block.pseudoBefore[k]};\n`;
    }
    lines += `}`;
  }
  // pseudoAfter
  if (block.pseudoAfter) {
    lines += `\n${className}::after {\n`;
    for (const k of Object.keys(block.pseudoAfter)) {
      lines += `  ${k}: ${block.pseudoAfter[k]};\n`;
    }
    lines += `}`;
  }

  return new vscode.Hover({ language: 'css', value: lines });
}

/** MAIN EXTENSION */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active (final w/ semicolons)');

  let paletteColors: string[] = [];
  let screenDict: Record<string, string> = {};

  if (vscode.workspace.workspaceFolders?.length) {
    try {
      const foundUris = await vscode.workspace.findFiles(
        '**/styledwind.theme.ts',
        '**/node_modules/**',
        1
      );
      if (foundUris.length > 0) {
        const themeFilePath = foundUris[0].fsPath;
        paletteColors = parseThemePaletteFile(themeFilePath);
        screenDict = parseThemeScreenDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // bracketProvider
  const bracketProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) return;

        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        const m = /(\w+)\[$/.exec(textBeforeCursor);
        if (!m) return;

        const ab = m[1];
        const cssProp = abbrMap[ab];
        if (!cssProp) return;

        const possible = cssValues[cssProp] || [];
        if (!possible.length) return;

        return possible.map((val) => {
          const item = new vscode.CompletionItem(val, vscode.CompletionItemKind.Value);
          item.detail = `CSS value for ${cssProp}`;
          item.insertText = val;
          return item;
        });
      },
    },
    '['
  );

  // dashProvider
  const dashProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideCompletionItems(document, position) {
        if (!document.fileName.endsWith('.css.ts')) return;
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        const m = /(\w+)\[.*?--$/.exec(textBeforeCursor);
        if (!m) return;

        if (!paletteColors.length) return;
        return paletteColors.map((colorVar) => {
          const item = new vscode.CompletionItem(colorVar, vscode.CompletionItemKind.Color);
          item.detail = 'Color from styledwind.theme.ts';
          item.insertText = colorVar;

          const replaceStart = position.translate(0, -2);
          const replaceRange = new vscode.Range(replaceStart, position);
          item.range = replaceRange;

          return item;
        });
      },
    },
    '-'
  );

  // Hover
  const hoverProvider = vscode.languages.registerHoverProvider(
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

        for (const className of Object.keys(blocks)) {
          const block = blocks[className];
          const lineInfo = block.linesMap[hoveredText];
          if (lineInfo) {
            return buildLineHover(lineInfo);
          }
        }

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

  context.subscriptions.push(bracketProvider, dashProvider, hoverProvider);
}

export function deactivate() {}
