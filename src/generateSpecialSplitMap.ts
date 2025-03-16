/***********************************************
 * generateSpecialSplitMap.ts
 * ---------------------------------------------
 * สคริปต์นี้จะอ่าน abbrMap จาก constants.ts
 * แล้วสร้างไฟล์ `specialSplitMap.ts` โดยอัตโนมัติ
 * ซึ่งในนั้นจะมีการ split แต่ละ abbr เป็นหลายส่วน
 * เพื่อทำ ghost text (Inlay Hints) ได้ง่าย
 ***********************************************/

import * as fs from 'fs';
import * as path from 'path';
import { abbrMap } from './constants';

/**
 * autoSplitAbbr:
 * รับ abbr (เช่น 'bg') และ property เต็ม (เช่น 'background-color')
 * แล้วพยายามจับแต่ละตัวอักษรใน abbr
 * หาใน property แล้ว slice ส่วน "ระหว่าง" ให้เป็น text
 *
 * ตัวอย่าง:
 *   abbr = "bg"
 *   property = "background-color"
 * - 'b' (index=0 ใน abbr)
 *   -> หา 'b' ใน "background-color" จากตำแหน่ง 0 => เจอที่ index=0
 *   -> ยังไม่มี chunk ก่อนหน้า (เพราะเป็นตัวแรก)
 *   -> propSearchStart = 1
 * - 'g' (index=1 ใน abbr)
 *   -> หา 'g' ใน "background-color" ตั้งแต่ propSearchStart=1 => เจอ index=4
 *   -> chunk= substring(1..4) => "ack"
 *   -> push {pos:1, text:"ack"}
 *   -> propSearchStart=5
 * - abbrIndex=2 (หมด abbr แล้ว)
 *   -> chunk สุดท้าย substring(5..end) => "round-color"
 *   -> push {pos:2, text:"round-color"}
 * => รวมผล: [{pos:1, text:"ack"}, {pos:2, text:"round-color"}]
 */
function autoSplitAbbr(abbr: string, property: string) {
  interface SplitItem {
    pos: number;
    text: string;
  }
  const results: SplitItem[] = [];

  let abbrIndex = 0; // index ภายใน abbr
  let propSearchStart = 0; // จุดเริ่มค้นหาตัวอักษรถัดไปใน property

  while (abbrIndex < abbr.length) {
    const currentChar = abbr[abbrIndex];
    const foundIndex = property.indexOf(currentChar, propSearchStart);
    if (foundIndex < 0) {
      // หาไม่เจอแล้ว => พอแค่นี้
      break;
    }
    // ถ้าตัวแรก (abbrIndex=0) จะยังไม่ต้องเก็บ chunk
    if (abbrIndex > 0) {
      // chunk = substring(propSearchStart .. foundIndex)
      const chunk = property.substring(propSearchStart, foundIndex);
      if (chunk) {
        // pos = ตำแหน่ง (เช่น 1-based) => abbrIndex คือ index 0-based ของ abbr
        // แต่ผู้ใช้ inlayHints อาจอยากให้ pos = abbrIndex
        // เช่น ถ้า abbr = 'bg', b=0, g=1 => pos=1 => แปลว่าหลังตัวอักษร b
        const pos = abbrIndex;
        results.push({ pos, text: chunk });
      }
    }
    // ข้ามตัวอักษร property ตำแหน่ง foundIndex ไป 1
    propSearchStart = foundIndex + 1;
    abbrIndex++;
  }

  // ถ้า abbrIndex == abbr.length => อาจมีส่วนท้ายเหลือ
  if (abbrIndex === abbr.length && propSearchStart < property.length) {
    const chunk = property.substring(propSearchStart);
    if (chunk) {
      results.push({ pos: abbrIndex, text: chunk });
    }
  }

  return results;
}

function buildSpecialSplitMap() {
  const result: Record<string, Array<{ pos: number; text: string }>> = {};

  for (const abbr of Object.keys(abbrMap)) {
    const fullProp = abbrMap[abbr];
    const splitted = autoSplitAbbr(abbr, fullProp);

    if (splitted.length > 0) {
      // ถ้ามีการ split ก็ใส่ลง result
      result[abbr] = splitted;
    } else {
      // ถ้าไม่มี split ก็ไม่ใส่ หรือจะใส่ array ว่างก็ได้
      // result[abbr] = [];
    }
  }

  return result;
}

// 1) สร้าง object
const specialSplitMap = buildSpecialSplitMap();
// 2) สร้างสตริงเพื่อนำไปเขียนไฟล์ specialSplitMap.ts
const code = `/** 
 * specialSplitMap: สร้างอัตโนมัติจาก generateSpecialSplitMap.ts
 * mapping สำหรับ inlayHints: abbr -> Array<{ pos: number; text: string }>
 */
export const specialSplitMap = ${JSON.stringify(specialSplitMap, null, 2)}; 
`;

// 3) เขียนไฟล์
const outputPath = path.join(__dirname, 'specialSplitMap.ts');
fs.writeFileSync(outputPath, code, 'utf8');

console.log(`✅ Successfully generated specialSplitMap.ts at: ${outputPath}`);
