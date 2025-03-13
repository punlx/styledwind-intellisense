// parseTheme.ts
import * as fs from 'fs';

/**
 * parseThemePaletteFile:
 *  - หา theme.palette([...]) ในไฟล์
 *  - ดู column แรก (ยกเว้นแถวแรก) => ['blue-100', '#E3F2FD', ...]
 *  - คืน array เป็น ["--blue-100", "--blue-200", ...]
 *    (ใช้เพื่อรองรับของเดิมที่มีอยู่)
 */
export function parseThemePaletteFile(themeFilePath: string): string[] {
  if (!fs.existsSync(themeFilePath)) return [];
  const content = fs.readFileSync(themeFilePath, 'utf8');

  // จับ pattern theme.palette([...])
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) return [];

  const inside = match.groups.inside;
  const lines = inside.split('\n');

  const result: string[] = [];
  let skipFirstRow = true;

  for (let line of lines) {
    line = line.trim();
    // ข้ามบรรทัดที่ไม่เริ่มด้วย '['
    if (!line.startsWith('[')) continue;

    // บรรทัดแรกคือ header เช่น ['dark','light','dim'] => skip
    if (skipFirstRow) {
      skipFirstRow = false;
      continue;
    }

    // regex จับค่าตัวแรกของ array เช่น ['blue-100', '#E3F2FD', ...]
    const rowMatch = /^\[\s*['"]([^'"]+)['"]/.exec(line);
    if (rowMatch) {
      const colorName = rowMatch[1];
      result.push(`--${colorName}`);
    }
  }
  return result;
}

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
    // เช่น "'blue-100',' #E3F2FD','#BBDEFB','#90CAF9'" => array
    const rawInner = arrMatch[1];
    // split โดยดูจาก ',' หรือจะใช้ regex เลยก็ได้
    const stringItems = rawInner.split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, ''));

    if (isFirstRow) {
      // บรรทัดแรก => header
      header = stringItems; // เช่น ['dark','light','dim']
      isFirstRow = false;
    } else {
      // บรรทัดถัด ๆ => ข้อมูลสี
      // stringItems[0] = ชื่อสี เช่น "blue-100"
      // ที่เหลือเป็นค่าของแต่ละ header
      if (stringItems.length > 1) {
        const colorKey = stringItems[0]; // ex. "blue-100"
        paletteMap[colorKey] = {};

        // ex. header = ['dark','light','dim']
        // ex. stringItems = ['blue-100','#E3F2FD','#BBDEFB','#90CAF9']
        // เริ่มจาก i=1 = dark, i=2 = light, i=3 = dim
        for (let i = 1; i < stringItems.length; i++) {
          const colName = header[i - 1]; // 'dark','light','dim'
          const colValue = stringItems[i]; // '#E3F2FD'
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
