import * as vscode from 'vscode';
import * as fs from 'fs';
import { abbrMap, cssValues } from './constants';

/** โครงสร้างข้อมูล 1 block */
interface IClassBlock {
  base: Record<string, string>;
  hover?: Record<string, string>;
  screens?: Array<{ query: string; props: Record<string, string> }>;
  container?: Array<{ query: string; props: Record<string, string> }>;
  pseudoBefore?: Record<string, string>;
  pseudoAfter?: Record<string, string>;
}

/**
 * parseThemePaletteFile: ไม่เปลี่ยน
 */
function parseThemePaletteFile(themeFilePath: string): string[] {
  if (!fs.existsSync(themeFilePath)) {
    return [];
  }
  const content = fs.readFileSync(themeFilePath, 'utf8');
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) {
    return [];
  }

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

/**
 * parseThemeScreenDict:
 * ถ้าคุณมี theme.screen({ sm:'max-w[700px]', ...}) => parse ให้เป็น { sm:'max-w[700px]' }
 */
function parseThemeScreenDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) {
    return dict;
  }
  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regScreens = /theme\.screen\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regScreens.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim(); // เช่น " sm:'max-w[700px]', lg:'min-w[1200px]' "
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  for (const ln of lines) {
    // sm: 'max-w[700px]'
    const m2 = /^(\w+)\s*:\s*['"]([^'"]+)['"]/.exec(ln);
    if (m2) {
      dict[m2[1]] = m2[2];
    }
  }
  return dict;
}

/** แปลง e.g. "max-w[600px]" หรือ "sm" => "(max-width:600px)" */
function convertScreenOrBreakpoint(token: string, screenDict: Record<string, string>): string {
  // ถ้า token = sm => เอาจาก screenDict
  if (screenDict[token]) token = screenDict[token]; // e.g. 'max-w[700px]'

  // ตอนนี้ token = "max-w[600px]" หรือ "min-w[1000px]"
  const m = /^(max|min)-w\[(\d+px)\]$/.exec(token);
  if (!m) return '';
  const type = m[1]; // max | min
  const size = m[2]; // 600px
  return `(${type}-width: ${size})`;
}

/** parseBlocksExtended:
 * parse .class { ... } => IClassBlock
 * รองรับ:
 *   base: c[yellow], bg[red]
 *   hover(...), screen(...), container(...), before(...), after(...)
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
      .map((x) => x.trim())
      .filter(Boolean);

    const block: IClassBlock = {
      base: {},
    };

    for (const line of lines) {
      // check line pattern
      // 1) base e.g. c[yellow]
      let m = /^(\w+)\[([^\]]+)\]$/.exec(line);
      if (m) {
        const ab = m[1];
        const val = m[2];
        const cssProp = abbrMap[ab];
        if (cssProp) {
          block.base[cssProp] = val;
        }
        continue;
      }

      // 2) hover(...) => hoverProps
      if (/^hover\(.+\)$/.test(line)) {
        const inner = line.replace(/^hover\(|\)$/g, '').trim(); // e.g. "bg[pink] c[blue]"
        const props: Record<string, string> = {};
        const splitted = inner.split(/\s+/);
        for (const sp of splitted) {
          const mm = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm) {
            const ab = mm[1];
            const val = mm[2];
            const cssProp = abbrMap[ab];
            if (cssProp) {
              props[cssProp] = val;
            }
          }
        }
        block.hover = props;
        continue;
      }

      // 3) screen(...) => screens array
      if (/^screen\(.+\)$/.test(line)) {
        if (!block.screens) {
          block.screens = [];
        }
        const inner = line.replace(/^screen\(|\)$/g, '').trim();
        // e.g. "max-w[600px], bg[black]" or "sm, bg[black]"
        const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
        if (!queryPart || !stylePart) continue;

        const mediaQuery = convertScreenOrBreakpoint(queryPart, screenDict);
        if (!mediaQuery) continue;

        const props: Record<string, string> = {};
        const splitted = stylePart.split(/\s+/);
        for (const sp of splitted) {
          const mm = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm) {
            const ab = mm[1];
            const val = mm[2];
            const cssProp = abbrMap[ab];
            if (cssProp) {
              props[cssProp] = val;
            }
          }
        }
        block.screens.push({
          query: mediaQuery,
          props,
        });
        continue;
      }

      // 4) container(...)
      if (/^container\(.+\)$/.test(line)) {
        if (!block.container) {
          block.container = [];
        }
        const inner = line.replace(/^container\(|\)$/g, '').trim();
        // e.g. "max-w[700px], bg[green]"
        const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
        if (!queryPart || !stylePart) continue;

        // convert "max-w[700px]" => "(max-width:700px)"
        // reuse logic or similar
        let containerQuery = '';
        const mm = /^(\w+)-w\[(\d+px)\]$/.exec(queryPart);
        if (mm) {
          containerQuery = `(${mm[1]}-width: ${mm[2]})`;
        }

        const props: Record<string, string> = {};
        const splitted = stylePart.split(/\s+/);
        for (const sp of splitted) {
          const mm2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm2) {
            const ab = mm2[1];
            const val = mm2[2];
            const cssProp = abbrMap[ab];
            if (cssProp) {
              props[cssProp] = val;
            }
          }
        }
        block.container.push({
          query: containerQuery,
          props,
        });
        continue;
      }

      // 5) before(...) / after(...)
      if (/^(before|after)\(.+\)$/.test(line)) {
        const isBefore = line.startsWith('before(');
        const isAfter = line.startsWith('after(');
        const inner = line.replace(/^(before|after)\(|\)$/g, '').trim();
        const splitted = inner.split(/\s+/);
        const pseudoProps: Record<string, string> = {};
        for (const sp of splitted) {
          const mm = /^(\w+)\[([^\]]+)\]$/.exec(sp);
          if (mm) {
            const ab = mm[1];
            const val = mm[2];
            const cssProp = abbrMap[ab];
            if (cssProp) {
              pseudoProps[cssProp] = val;
            }
          }
        }
        if (isBefore) block.pseudoBefore = pseudoProps;
        if (isAfter) block.pseudoAfter = pseudoProps;
      }
    }

    result[className] = block;
  }

  return result;
}

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active! (All features)');

  // 1) อ่าน themeFile ถ้ามี
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
        console.log('Found theme file:', themeFilePath);
        paletteColors = parseThemePaletteFile(themeFilePath);
        // parse screen dictionary
        screenDict = parseThemeScreenDict(themeFilePath);
        console.log('Parsed palette =>', paletteColors);
        console.log('Parsed screen =>', screenDict);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // 2) bracketProvider
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

  // 3) dashProvider
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

  // 4) HoverProvider (all features)
  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ],
    {
      provideHover(document, position) {
        if (!document.fileName.endsWith('.css.ts')) return;

        // parse all blocks
        const docText = document.getText();
        const blocks = parseBlocksExtended(docText, screenDict);

        // find token
        const range = document.getWordRangeAtPosition(
          position,
          // case1 .class, case2 abbr[value], case3 hover(...), screen(...), container(...), before(...), after(...)
          /(\.\w+)|(hover\(.+\))|(screen\(.+\))|(container\(.+\))|((before|after)\(.+\))|(\w+\[[^\]]+\])/
        );
        if (!range) return;
        const hoveredText = document.getText(range);

        // 4.1) abbr[value]
        let mm = /^(\w+)\[([^\]]+)\]$/.exec(hoveredText);
        if (mm) {
          const ab = mm[1];
          const val = mm[2];
          const cssProp = abbrMap[ab];
          if (!cssProp) return;
          const text = `${cssProp}: ${val}`;
          return new vscode.Hover({ language: 'css', value: text });
        }

        // 4.2) hover(...)
        if (/^hover\(.+\)$/.test(hoveredText)) {
          // e.g. hover(bg[pink] c[blue])
          // parse inside
          const inner = hoveredText.replace(/^hover\(|\)$/g, '').trim(); // "bg[pink] c[blue]"
          const splitted = inner.split(/\s+/);
          const props: Record<string, string> = {};
          splitted.forEach((sp) => {
            const m2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
            if (m2) {
              const ab = m2[1];
              const val = m2[2];
              const cssProp = abbrMap[ab];
              if (cssProp) props[cssProp] = val;
            }
          });
          // แสดง .class:hover { ... } -> แต่ .class อะไร?
          // parseBlocksExtended ถ้า line = hover(bg[pink]...) => block.hover
          // simpler: แค่ show block:
          let lines = `.hover {\n`;
          for (const k in props) {
            lines += `  ${k}: ${props[k]}\n`;
          }
          lines += `}`;
          return new vscode.Hover({ language: 'css', value: lines });
        }

        // 4.3) screen(...)
        if (/^screen\(.+\)$/.test(hoveredText)) {
          // parse
          const inner = hoveredText.replace(/^screen\(|\)$/g, '').trim();
          const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
          if (!queryPart || !stylePart) return;
          const mediaQuery = convertScreenOrBreakpoint(queryPart, screenDict);
          // parse stylePart => props
          const splitted = stylePart.split(/\s+/);
          const props: Record<string, string> = {};
          splitted.forEach((sp) => {
            const m2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
            if (m2) {
              const ab = m2[1];
              const val = m2[2];
              const cssProp = abbrMap[ab];
              if (cssProp) props[cssProp] = val;
            }
          });
          let lines = `@media only screen and ${mediaQuery} {\n  .xxx {\n`;
          for (const k in props) {
            lines += `    ${k}: ${props[k]}\n`;
          }
          lines += `  }\n}`;
          return new vscode.Hover({ language: 'css', value: lines });
        }

        // 4.4) container(...)
        if (/^container\(.+\)$/.test(hoveredText)) {
          const inner = hoveredText.replace(/^container\(|\)$/g, '').trim();
          const [queryPart, stylePart] = inner.split(',').map((x) => x.trim());
          if (!queryPart || !stylePart) return;
          let containerQuery = '';
          const mm2 = /^(\w+)-w\[(\d+px)\]$/.exec(queryPart);
          if (mm2) {
            containerQuery = `(${mm2[1]}-width: ${mm2[2]})`;
          }
          const splitted = stylePart.split(/\s+/);
          const props: Record<string, string> = {};
          splitted.forEach((sp) => {
            const mm3 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
            if (mm3) {
              const ab = mm3[1];
              const val = mm3[2];
              const cssProp = abbrMap[ab];
              if (cssProp) props[cssProp] = val;
            }
          });
          let lines = `@container ${containerQuery} {\n  .xxx {\n`;
          for (const k in props) {
            lines += `    ${k}: ${props[k]}\n`;
          }
          lines += `  }\n}`;
          return new vscode.Hover({ language: 'css', value: lines });
        }

        // 4.5) before(...) / after(...)
        if (/^(before|after)\(.+\)$/.test(hoveredText)) {
          const isBefore = hoveredText.startsWith('before(');
          const isAfter = hoveredText.startsWith('after(');
          const inner = hoveredText.replace(/^(before|after)\(|\)$/g, '').trim();
          const splitted = inner.split(/\s+/);
          const props: Record<string, string> = {};
          splitted.forEach((sp) => {
            const mm2 = /^(\w+)\[([^\]]+)\]$/.exec(sp);
            if (mm2) {
              const ab = mm2[1];
              const val = mm2[2];
              const cssProp = abbrMap[ab];
              if (cssProp) props[cssProp] = val;
            }
          });
          let lines = `.xxx::${isBefore ? 'before' : 'after'} {\n`;
          for (const k in props) {
            lines += `  ${k}: ${props[k]}\n`;
          }
          lines += `}`;
          return new vscode.Hover({ language: 'css', value: lines });
        }

        // 4.6) .className => แสดง base + hover + screens + container + pseudo
        if (hoveredText.startsWith('.')) {
          const block = blocks[hoveredText];
          if (!block) return;

          // สร้าง multiline
          let lines = `${hoveredText} {\n`;
          for (const k in block.base) {
            lines += `  ${k}: ${block.base[k]}\n`;
          }
          lines += `}`;
          if (block.hover) {
            lines += `\n${hoveredText}:hover {\n`;
            for (const k in block.hover) {
              lines += `  ${k}: ${block.hover[k]}\n`;
            }
            lines += `}`;
          }
          if (block.screens && block.screens.length > 0) {
            for (const sc of block.screens) {
              lines += `\n@media only screen and ${sc.query} {\n  ${hoveredText} {\n`;
              for (const k in sc.props) {
                lines += `    ${k}: ${sc.props[k]}\n`;
              }
              lines += `  }\n}`;
            }
          }
          if (block.container && block.container.length > 0) {
            for (const ctn of block.container) {
              lines += `\n@container ${ctn.query} {\n  ${hoveredText} {\n`;
              for (const k in ctn.props) {
                lines += `    ${k}: ${ctn.props[k]}\n`;
              }
              lines += `  }\n}`;
            }
          }
          if (block.pseudoBefore) {
            lines += `\n${hoveredText}::before {\n`;
            for (const k in block.pseudoBefore) {
              lines += `  ${k}: ${block.pseudoBefore[k]}\n`;
            }
            lines += `}`;
          }
          if (block.pseudoAfter) {
            lines += `\n${hoveredText}::after {\n`;
            for (const k in block.pseudoAfter) {
              lines += `  ${k}: ${block.pseudoAfter[k]}\n`;
            }
            lines += `}`;
          }

          return new vscode.Hover({ language: 'css', value: lines });
        }

        return;
      },
    }
  );

  context.subscriptions.push(bracketProvider, dashProvider, hoverProvider);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
