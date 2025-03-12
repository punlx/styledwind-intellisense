import * as fs from 'fs';
import * as path from 'path';

/**
 * parseThemePaletteFile:
 * รับ path ของไฟล์ theme (เช่น "styledwind.theme.ts")
 * แล้วดึงค่า "column แรก" ของทุกแถว (ยกเว้นแถว 0 ที่เป็น ['dark', 'light', 'dim'])
 * เช่น ['blue-100', 'blue-200', ...]
 *
 * จากนั้นจะคืนค่าพร้อมเติม "--" ข้างหน้า (เช่น ["--blue-100", "--blue-200", ...]) เพื่อเอาไว้ Suggest
 */
export function parseThemePaletteFile(themeFilePath: string): string[] {
  if (!fs.existsSync(themeFilePath)) {
    return [];
  }
  const content = fs.readFileSync(themeFilePath, 'utf8');

  // ใช้ Regex จับเฉพาะส่วนใน theme.palette([...]) แล้วเก็บใส่ groups.inside
  // [\s\S]*? จะจับ multiline แบบขี้เกียจ (lazily)
  const mainRegex = /theme\.palette\s*\(\s*\[(?<inside>[\s\S]*?)\]\s*\)/m;
  const match = mainRegex.exec(content);
  if (!match?.groups?.inside) {
    return [];
  }

  const inside = match.groups.inside; // ข้อความระหว่าง []

  // แยกเป็นแต่ละบรรทัด
  const lines = inside.split('\n');

  const result: string[] = [];
  let isFirstRow = true; // แถวแรกคือ [ 'dark', 'light', 'dim'] => skip

  for (let line of lines) {
    line = line.trim();
    if (!line.startsWith('[')) {
      continue; // ข้ามถ้าไม่ใช่ '['
    }

    if (isFirstRow) {
      // แถวแรกคือ ['dark','light','dim'] => ข้าม
      isFirstRow = false;
      continue;
    }

    // ตัวอย่าง line:  `['blue-100', '#E3F2FD', '#BBDEFB', '#90CAF9'],`
    // ใช้ regex ดึง column แรก => "blue-100"
    const rowMatch = /^\[\s*['"]([^'"]+)['"]/.exec(line);
    if (rowMatch) {
      const colorName = rowMatch[1]; // ex. "blue-100"
      // ใส่ -- ข้างหน้าให้สอดคล้องกับการใช้ var(--xxx)
      result.push(`--${colorName}`);
    }
  }
  return result;
}

/**
 * Helper function: รับ basePath (root workspace) + path ใน settings
 * แล้ว parse ออกมาเป็น array ของสี
 */
export function loadPaletteColors(
  workspacePath: string | undefined,
  themeRelativePath: string
): string[] {
  if (!workspacePath) {
    // ถ้าไม่มี workspacePath เช่น user เปิดไฟล์เดี่ยว ๆ
    return [];
  }

  const fullPath = path.join(workspacePath, themeRelativePath);
  try {
    return parseThemePaletteFile(fullPath);
  } catch (err) {
    console.error('Error parsing theme file: ', err);
    return [];
  }
}
