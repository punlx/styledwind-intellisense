// parseTheme.ts
import * as fs from 'fs';

/**
 * parseThemePaletteFull:
 *  - หา theme.palette([...]) ในไฟล์
 *  - ดึงแถวแรกเป็น header: ['dark','light','dim']
 *  - แถวถัด ๆ มาเป็น data: ['blue-100', '#E3F2FD','#BBDEFB','#90CAF9']
 *  - คืน object เช่น {
 *      "blue-100": { dark: "#E3F2FD", light: "#BBDEFB", dim: "#90CAF9" },
 *      ...
 *    }
 */
export function parseThemePaletteFull(
  themeFilePath: string
): Record<string, Record<string, string>> {
  const paletteMap: Record<string, Record<string, string>> = {};
  if (!fs.existsSync(themeFilePath)) return paletteMap;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regPalette = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = regPalette.exec(content);
  if (!match?.groups?.inside) return paletteMap;

  const inside = match.groups.inside;
  const lines = inside
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let header: string[] = [];
  let isFirstRow = true;

  for (const line of lines) {
    if (!line.startsWith('[')) {
      continue;
    }
    const arrayRegex = /^\[\s*(.+)\s*\]/;
    const arrMatch = arrayRegex.exec(line);
    if (!arrMatch) continue;

    const rawInner = arrMatch[1];
    const stringItems = rawInner.split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, ''));

    if (isFirstRow) {
      header = stringItems;
      isFirstRow = false;
    } else {
      if (stringItems.length > 1) {
        const colorKey = stringItems[0];
        paletteMap[colorKey] = {};
        for (let i = 1; i < stringItems.length; i++) {
          const colName = header[i - 1];
          const colValue = stringItems[i];
          paletteMap[colorKey][colName] = colValue;
        }
      }
    }
  }

  return paletteMap;
}

/**
 * parseThemeBreakpointDict:
 *  - หา theme.screen({...}) => { sm:'max-w[700px]', md:'min-w[900px]'...}
 */
export function parseThemeBreakpointDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regBreakpoint = /theme\.breakpoint\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regBreakpoint.exec(content);
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

/**
 * parseThemeTypographyDict:
 *  - หา theme.font({...}) => { 'display-1': 'fs[22px] fw[500]', ... }
 */
export function parseThemeTypographyDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regTypography = /theme\.typography\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regTypography.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim();
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  for (const ln of lines) {
    const m2 = /^['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/.exec(ln);
    if (m2) {
      dict[m2[1]] = m2[2];
    }
  }

  return dict;
}

/**
 * parseThemeKeyframeDict:
 *  - หา theme.keyframe({...}) => { 'my-move': '0%(...)', 'pulse': 'from(...) to(...)' }
 */
export function parseThemeKeyframeDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regKeyframe = /theme\.keyframe\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regKeyframe.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim();
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  for (const ln of lines) {
    const m2 = /^['"]?([\w-]+)['"]?\s*:\s*[`'"]([^`'"]+)[`'"]/.exec(ln);
    if (m2) {
      const keyName = m2[1];
      const keyframeValue = m2[2].trim();
      dict[keyName] = keyframeValue;
    }
  }

  return dict;
}

/**
 * parseThemeVariableDict:
 *  - หา theme.variable({...}) => { 'spacing-1': '12px', ... }
 */
export function parseThemeVariableDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regVariable = /theme\.variable\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regVariable.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim();
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  for (const ln of lines) {
    const m2 = /^['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/.exec(ln);
    if (m2) {
      const spacingKey = m2[1];
      const spacingVal = m2[2];
      dict[spacingKey] = spacingVal;
    }
  }

  return dict;
}

/**
 * parseThemeDefine:
 *  - หา theme.define({...}) => เช่น
 *    theme.define({
 *      button: {
 *        primary: `...`,
 *        secondary: `...`
 *      },
 *      card: {
 *        card1: `...`,
 *        card2: `...`
 *      }
 *    });
 *  - คืนเป็น object => { button:["primary","secondary"], card:["card1","card2"] }
 */
export function parseThemeDefine(themeFilePath: string): Record<string, string[]> {
  const res: Record<string, string[]> = {};
  if (!fs.existsSync(themeFilePath)) return res;

  const fileContent = fs.readFileSync(themeFilePath, 'utf8');

  // จับบล็อก theme.define({ ... })
  const defineRegex = /theme\.define\s*\(\s*\{\s*([\s\S]*?)\}\s*\)/m;
  const mainMatch = defineRegex.exec(fileContent);
  if (!mainMatch) return res;

  const body = mainMatch[1]; // เนื้อใน {...}

  // จับ top-level เช่น button: { ... }, card: { ... }
  // ยังเป็น regex คร่าว ๆ
  const topObjRegex = /(\w+)\s*:\s*\{([\s\S]*?)\},?/g;
  let match: RegExpExecArray | null;
  while ((match = topObjRegex.exec(body)) !== null) {
    const mainKey = match[1];
    const innerBody = match[2];

    // subKey เช่น primary: `...`, secondary:`...`
    const subKeys: string[] = [];
    const subRegex = /(\w+)\s*:\s*[`'"]([^`'"]*)[`'"]/g;
    let subMatch: RegExpExecArray | null;
    while ((subMatch = subRegex.exec(innerBody)) !== null) {
      const subKey = subMatch[1];
      subKeys.push(subKey);
    }

    res[mainKey] = subKeys;
  }

  return res;
}
