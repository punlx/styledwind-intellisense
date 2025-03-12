// parseTheme.ts
import * as fs from 'fs';

/** parseThemePaletteFile:
 *  - หา theme.palette([...]) ในไฟล์
 *  - ดู column แรก (ยกเว้นแถวแรก) => ['blue-100', '#E3F2FD', ...]
 *  - คืน array ที่เป็น ["--blue-100","--blue-200",...]
 */
export function parseThemePaletteFile(themeFilePath: string): string[] {
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

/** parseThemeScreenDict:
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
