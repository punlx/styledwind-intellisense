import * as fs from 'fs';

/**
 * parseThemePaletteFull:
 *  - หา theme.palette([...]) ในไฟล์
 *  - ดึงแถวแรกเป็น header: ['dark','light','dim']
 *  - แถวถัด ๆ มาเป็น data: ['blue-100', '#E3F2FD','#BBDEFB','#90CAF9']
 *  - คืน object เช่น {
 *      "blue-100": { dark: "#E3F2FD", light: "#BBDEFB", dim: "#90CAF9" },
 *      "blue-200": { dark: "#64B5F6", light: "#42A5F5", dim: "#2196F3" },
 *      ...
 *    }
 */
export function parseThemePaletteFull(
  themeFilePath: string
): Record<string, Record<string, string>> {
  const paletteMap: Record<string, Record<string, string>> = {};
  if (!fs.existsSync(themeFilePath)) return paletteMap;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) return paletteMap;

  const inside = match.groups.inside;
  const lines = inside
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // แถวแรกเป็น header เช่น ['dark','light','dim']
  let header: string[] = [];
  let isFirstRow = true;

  for (const line of lines) {
    if (!line.startsWith('[')) {
      continue; // ข้ามบรรทัดที่ไม่ใช่ array
    }

    // ดึงค่าภายใน []
    // ตัวอย่าง line: ['blue-100', '#E3F2FD', '#BBDEFB', '#90CAF9'],
    // หรือ line: ['dark', 'light', 'dim'],
    const arrayRegex = /^\[\s*(.+)\s*\]/;
    const arrMatch = arrayRegex.exec(line);
    if (!arrMatch) continue;

    // แยกค่าในบรรทัด (ตัด comma ให้เรียบร้อย)
    const rawInner = arrMatch[1];
    const stringItems = rawInner.split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, ''));

    if (isFirstRow) {
      // บรรทัดแรก => header
      header = stringItems; // เช่น ['dark','light','dim']
      isFirstRow = false;
    } else {
      // บรรทัดถัด ๆ => ข้อมูลสี
      if (stringItems.length > 1) {
        const colorKey = stringItems[0]; // ex. "blue-100"
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
 * parseThemeScreenDict:
 *  - หา theme.screen({...}) => { sm:'max-w[700px]', md:'min-w[900px]'...}
 *  - คืน dict เช่น { sm:'max-w[700px]', md:'min-w[900px]' }
 */
export function parseThemeScreenDict(themeFilePath: string): Record<string, string> {
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

/**
 * parseThemeFontDict:
 *  - หา theme.font({...})
 *  - คืน { "display-1":"fs[22px] fw[500] fm[Sarabun-Bold]", ... }
 */
export function parseThemeFontDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regFont = /theme\.font\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regFont.exec(content);
  if (!mm) return dict;

  const body = mm[1].trim();
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  for (const ln of lines) {
    // ex. 'display-1': 'fs[22px] fw[500] fm[Sarabun-Bold]'
    const m2 = /^['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/.exec(ln);
    if (m2) {
      const fontKey = m2[1];
      const fontValue = m2[2];
      dict[fontKey] = fontValue;
    }
  }

  return dict;
}

/**
 * parseThemeKeyframeDict:
 *  - หา theme.keyframe({...})
 *  - คืน { "my-move": "0%(bg[red]...) 50%(...) 100%(...)", "pulse": "from(...) to(...)" }
 */
export function parseThemeKeyframeDict(themeFilePath: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!fs.existsSync(themeFilePath)) return dict;

  const content = fs.readFileSync(themeFilePath, 'utf8');
  const regKeyframe = /theme\.keyframe\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const mm = regKeyframe.exec(content);
  if (!mm) return dict;

  // ตัวบล็อก {...} ของ keyframe
  const body = mm[1].trim();
  // split ด้วย ',' เหมือนเดิม
  const lines = body
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  for (const ln of lines) {
    // ex. 'my-move': `
    //      0%(bg[red]) ...
    //    `,
    // หรือ 'pulse': `from(...) to(...)`,
    // Note: multiline => จับด้วย regex ช่วง : '...'
    const m2 = /^['"]?([\w-]+)['"]?\s*:\s*[`'"]([^`'"]+)[`'"]/.exec(ln);
    if (m2) {
      const keyName = m2[1];
      // m2[2] อาจไม่ได้รวมหลายบรรทัดเพราะ .split(',') ตัดไป
      // ถ้าธรรมชาติ code เขียนตัว keyframe ในบรรทัดเดียว => ใช้ได้
      // หาก multiline มากกว่านี้ อาจต้อง parse แบบอื่น
      const keyframeValue = m2[2].trim();
      dict[keyName] = keyframeValue;
    }
  }

  return dict;
}
