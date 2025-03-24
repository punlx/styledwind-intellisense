// cssTsColorProvider.ts
import * as vscode from 'vscode';
import { parseThemePaletteFull } from './parseTheme';

/**
 * สมมุติว่า parseThemePaletteFull คืนค่า:
 * {
 *   "blue-100": { "dark":"#000000", "light":"#BBDEFB", "dim":"#90CAF9" },
 *   "blue-200": { "dark":"#64B5F6", "light":"#42A5F5", "dim":"#2196F3" },
 *   ...
 * }
 */
let paletteMap: Record<string, Record<string, string>> = {};

/**
 * initPaletteMap:
 * เรียกตอน activate extension เพื่อลองหา styledwind.theme.ts ใน workspace
 * แล้ว parse เก็บในตัวแปร paletteMap
 */
export async function initPaletteMap() {
  const found = await vscode.workspace.findFiles('**/styledwind.theme.ts', '**/node_modules/**', 1);
  if (found.length > 0) {
    paletteMap = parseThemePaletteFull(found[0].fsPath);
  } else {
    paletteMap = {};
  }
}

/**
 * createCssTsColorProvider:
 *   - ทำงานเฉพาะไฟล์ *.css.ts (ต้องเป็น language=typescript, scheme=file)
 *   - ใช้ DocumentColorProvider เพื่อแสดง swatch สีตรง pattern:
 *       (\w+)\[([^\]]+)\]
 *     ex. "bg[--blue-100]", "c[#ffffff]", "bd-c[red]" ฯลฯ
 */
export function createCssTsColorProvider() {
  return vscode.languages.registerColorProvider(
    {
      pattern: '**/*.css.ts',
      scheme: 'file',
      language: 'typescript',
    },
    new CssTsColorProvider()
  );
}

class CssTsColorProvider implements vscode.DocumentColorProvider {
  provideDocumentColors(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    // (1) ดูว่ามีคอมเมนต์ // styledwind mode: xxx ในไฟล์มั้ย
    const docText = document.getText();
    const modeMatch = /\/\/\s*styledwind\s*mode:\s*(\w+)/.exec(docText);
    let mode: string | undefined;
    if (modeMatch) {
      mode = modeMatch[1]; // ex. "dark" / "light" / "dim"
    }

    // (2) จับ pattern (\w+)\[([^\]]+)\]
    //     เช่น ab="bg", val="--blue-100"
    //     ab="c", val="red"
    //     ab="bd-c", val="#ffffff"
    const colorInfos: vscode.ColorInformation[] = [];
    const pattern = /(\w+)\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(docText)) !== null) {
      const ab = match[1]; // bg, c, bd-c, ...
      const val = match[2]; // --blue-100 / #fff / red / ...

      // (3) parse color
      const colorObj = getColorFromValue(val, mode);
      if (!colorObj) {
        continue; // ถ้า parse ไม่ได้ => ไม่สร้าง swatch
      }

      // (4) หา offset ใน document เพื่อสร้าง range
      const startOff = match.index + ab.length + 1; // +1 สำหรับ '['
      const endOff = startOff + val.length;

      const startPos = document.positionAt(startOff);
      const endPos = document.positionAt(endOff);

      colorInfos.push(new vscode.ColorInformation(new vscode.Range(startPos, endPos), colorObj));
    }

    return colorInfos;
  }

  provideColorPresentations(
    color: vscode.Color,
    context: any, // ใช้ any หรือ { range: vscode.Range } ก็ได้
    token: vscode.CancellationToken
  ): vscode.ColorPresentation[] {
    // user ปรับสีใน color picker => เราแปลงเป็น #rrggbb
    const hex = toHexRGB(color);
    return [new vscode.ColorPresentation(hex)];
  }
}

/**
 * getColorFromValue:
 *   - ถ้าเป็น "--xxxx" => ถ้ามี mode => paletteMap[xxxx][mode], ถ้าไม่มี mode => ไม่โชว์
 *   - ถ้าเป็น "#..." => parseHexColor
 *   - ถ้าเป็น named color => map dict
 */
function getColorFromValue(val: string, mode?: string): vscode.Color | undefined {
  // (A) --xxx
  if (val.startsWith('--')) {
    if (!mode) {
      // ถ้าไม่มี mode => ไม่แสดง swatch
      return undefined;
    }
    const key = val.replace(/^--/, '');
    // ex. blue-100
    const rec = paletteMap[key];
    if (!rec) {
      return undefined;
    }
    // ถ้าพบ rec, ex. { "dark":"#000000", "light":"#BBDEFB", "dim":"#90CAF9" }
    const colorHex = rec[mode];
    if (!colorHex) {
      // อาจ fallback โหมดแรก
      return undefined;
    }
    return parseHexColor(colorHex);
  }

  // (B) #xxxxxx
  if (val.startsWith('#')) {
    return parseHexColor(val);
  }

  // (C) named color => dict
  const namedColorHex: Record<string, string> = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    black: '#000000',
    white: '#ffffff',
    gray: '#808080',
    grey: '#808080',
    // ... เพิ่มได้
  };
  const lower = val.toLowerCase();
  if (namedColorHex[lower]) {
    return parseHexColor(namedColorHex[lower]);
  }

  return undefined;
}

/**
 * parseHexColor:
 *   parse #rgb / #rgba / #rrggbb / #rrggbbaa => vscode.Color
 */
function parseHexColor(hex: string): vscode.Color | undefined {
  const raw = hex.replace('#', '');
  if (raw.length === 3) {
    // #RGB
    const r = parseInt(raw[0] + raw[0], 16) / 255;
    const g = parseInt(raw[1] + raw[1], 16) / 255;
    const b = parseInt(raw[2] + raw[2], 16) / 255;
    return new vscode.Color(r, g, b, 1);
  } else if (raw.length === 4) {
    // #RGBA
    const r = parseInt(raw[0] + raw[0], 16) / 255;
    const g = parseInt(raw[1] + raw[1], 16) / 255;
    const b = parseInt(raw[2] + raw[2], 16) / 255;
    const a = parseInt(raw[3] + raw[3], 16) / 255;
    return new vscode.Color(r, g, b, a);
  } else if (raw.length === 6) {
    // #RRGGBB
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    return new vscode.Color(r, g, b, 1);
  } else if (raw.length === 8) {
    // #RRGGBBAA
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    const a = parseInt(raw.slice(6, 8), 16) / 255;
    return new vscode.Color(r, g, b, a);
  }
  return undefined;
}

/**
 * toHexRGB: vscode.Color => "#rrggbb" (ไม่รวม alpha)
 */
function toHexRGB(color: vscode.Color): string {
  const r = Math.round(color.red * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(color.green * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(color.blue * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}
