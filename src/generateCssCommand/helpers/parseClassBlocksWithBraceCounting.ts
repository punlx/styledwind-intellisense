/** (option) parseContainerStyle / parseScreenStyle ถ้าต้องการ container/screen
    - ตัวอย่าง omitted หรือ simplified ...
**/

import { IClassBlock } from '../types';

export function parseClassBlocksWithBraceCounting(text: string): IClassBlock[] {
  const result: IClassBlock[] = [];

  // regex จับชื่อ class => .<className>{
  // แล้วใช้ brace counting เพื่อหา "}" ที่แท้จริง
  const pattern = /\.([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const className = match[1];
    // ตำแหน่งหลัง {
    const startIndex = pattern.lastIndex;
    let braceCount = 1;
    let i = startIndex;
    for (; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
      }
      if (braceCount === 0) {
        // เจอจุดปิด block แล้ว
        break;
      }
    }
    // i คือ index ของ '}' สุดท้าย
    const body = text.slice(startIndex, i).trim();

    result.push({
      className,
      body,
    });
  }

  return result;
}
