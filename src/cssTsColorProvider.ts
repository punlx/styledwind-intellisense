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
 * กลุ่ม A: value ใน [] เป็น “สี” เพียว ๆ
 * เช่น bg[red], c[#fff], bd-c[red], ol-c[#000], ...
 */
const groupA = new Set(['bg', 'c', 'bd-c', 'bdl-c', 'bdt-c', 'bdr-c', 'bdb-c', 'ol-c']);

/**
 * กลุ่ม B: value อาจมีหลาย token เช่น "2px solid red", "2px dashed --blue-100"
 * เช่น bd, bdl, bdt, bdr, bdb, ol, sd
 */
const groupB = new Set(['bd', 'bdl', 'bdt', 'bdr', 'bdb', 'ol', 'sd']);

/**
 * initPaletteMap:
 * - เรียกตอน activate extension เพื่อลองหา styledwind.theme.ts ใน workspace
 * - parse เก็บใน paletteMap
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
 *  - ทำงานเฉพาะไฟล์ *.css.ts (ต้องเป็น language=typescript, scheme=file)
 *  - ใช้ DocumentColorProvider เพื่อแสดง swatch สี ตาม pattern (\w+)\[([^\]]+)\]
 *    ex. "bg[--blue-100]", "c[#ffffff]", "bd-c[red]", "bd[2px solid red]"
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
    // (1) หา comment // styledwind mode: xxx
    const docText = document.getText();
    const modeMatch = /\/\/\s*styledwind\s*mode:\s*(\w+)/.exec(docText);
    let mode: string | undefined = undefined;
    if (modeMatch) {
      mode = modeMatch[1]; // ex. "dark","light","dim"
    }

    // (2) จับ pattern (\w+)\[([^\]]+)\]
    const pattern = /(\w+)\[([^\]]+)\]/g;
    const colorInfos: vscode.ColorInformation[] = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(docText)) !== null) {
      const ab = match[1]; // ex. "bg", "bd", "bd-c", "ol", ...
      const val = match[2]; // ex. "--blue-100", "#fff", "2px solid red", ...

      // (3) parse ให้ได้ "ColorToken[]" = [{ color:vscode.Color, startOffset:..., endOffset:... }, ...]
      const colorTokens = parseValue(ab, val, mode, match.index, document);

      // (4) สร้าง ColorInformation
      for (const ct of colorTokens) {
        colorInfos.push(
          new vscode.ColorInformation(
            new vscode.Range(
              document.positionAt(ct.startOffset),
              document.positionAt(ct.endOffset)
            ),
            ct.color
          )
        );
      }
    }

    return colorInfos;
  }

  provideColorPresentations(
    color: vscode.Color,
    context: any,
    token: vscode.CancellationToken
  ): vscode.ColorPresentation[] {
    // user ปรับสี -> #rrggbb
    const hex = toHexRGB(color);
    return [new vscode.ColorPresentation(hex)];
  }
}

/** โครงสร้างเก็บ color + offset ของ token ที่เป็นสี */
interface ColorToken {
  color: vscode.Color;
  startOffset: number;
  endOffset: number;
}

/**
 * parseValue:
 *  - แยกตาม group A/B
 *  - group A => parse ทั้ง val เป็นสีเดียว
 *  - group B => แยก val ด้วย space => parse token ไหนที่เป็นสี
 *  - คำนวณ offset ใน doc (token wise)
 */
function parseValue(
  ab: string,
  val: string,
  mode: string | undefined,
  matchIndex: number, // position ของ ab[...]
  document: vscode.TextDocument
): ColorToken[] {
  if (groupA.has(ab)) {
    // group A => ทั้ง val ควรเป็นสีเพียว ๆ
    const c = getColorFromToken(val, mode);
    if (c) {
      // offset = (matchIndex + ab.length + 1) for start
      const startOff = matchIndex + ab.length + 1; // +1 คือ '['
      const endOff = startOff + val.length;
      return [{ color: c, startOffset: startOff, endOffset: endOff }];
    }
    return [];
  } else if (groupB.has(ab)) {
    // group B => อาจมีหลาย token: "2px solid red"
    // เราจะ split ด้วย space
    // ถ้าต้องการ robust กว่านี้ (เช่น regex จับ #xxx, --xxx) ก็ปรับ
    const tokens = val.split(/\s+/);
    let colorTokens: ColorToken[] = [];

    // เพื่อคำนวณ offset ของ token แต่ละตัวใน val
    // val ex. "2px solid red"
    // start offset ใน doc = matchIndex + ab.length + 1
    let currentPos = 0;
    const baseOffset = matchIndex + ab.length + 1; // '['

    for (const tk of tokens) {
      const c = getColorFromToken(tk, mode);
      if (c) {
        // token tk มีสี
        const startOff = baseOffset + currentPos;
        // tk.length
        const endOff = startOff + tk.length;

        colorTokens.push({ color: c, startOffset: startOff, endOffset: endOff });
      }

      // +1 เนื่องจากเรา split ด้วย space => "2px" + " " => 5 chars
      currentPos += tk.length + 1;
    }

    return colorTokens;
  } else {
    // ไม่อยู่ใน group A หรือ B => ไม่ parse
    return [];
  }
}

/**
 * getColorFromToken:
 *   - ถ้าเป็น "--xxxx" => ถ้ามี mode => paletteMap[xxxx][mode], ถ้าไม่มี mode => undefined
 *   - ถ้าเป็น "#xxxxxx" => parseHex
 *   - ถ้าเป็น named color => parse dict
 *   - else => undefined
 */
function getColorFromToken(token: string, mode?: string): vscode.Color | undefined {
  // (A) --xxx
  if (token.startsWith('--')) {
    if (!mode) return undefined;
    const key = token.replace(/^--/, '');
    const rec = paletteMap[key];
    if (!rec) return undefined;
    const colorHex = rec[mode];
    if (!colorHex) return undefined;
    return parseHexColor(colorHex);
  }
  // (B) #xxxx => parse hex
  if (token.startsWith('#')) {
    return parseHexColor(token);
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
  };
  const lower = token.toLowerCase();
  if (namedColorHex[lower]) {
    return parseHexColor(namedColorHex[lower]);
  }

  return undefined;
}

/**
 * parseHexColor => vscode.Color
 * รองรับ #rgb / #rgba / #rrggbb / #rrggbbaa
 */
function parseHexColor(hex: string): vscode.Color | undefined {
  const raw = hex.replace('#', '');
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16) / 255;
    const g = parseInt(raw[1] + raw[1], 16) / 255;
    const b = parseInt(raw[2] + raw[2], 16) / 255;
    return new vscode.Color(r, g, b, 1);
  } else if (raw.length === 4) {
    const r = parseInt(raw[0] + raw[0], 16) / 255;
    const g = parseInt(raw[1] + raw[1], 16) / 255;
    const b = parseInt(raw[2] + raw[2], 16) / 255;
    const a = parseInt(raw[3] + raw[3], 16) / 255;
    return new vscode.Color(r, g, b, a);
  } else if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    return new vscode.Color(r, g, b, 1);
  } else if (raw.length === 8) {
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    const a = parseInt(raw.slice(6, 8), 16) / 255;
    return new vscode.Color(r, g, b, a);
  }
  return undefined;
}

/** toHexRGB => "#rrggbb" */
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
