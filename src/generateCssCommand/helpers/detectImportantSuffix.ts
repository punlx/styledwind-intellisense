/** detect !important (ลงท้ายด้วย "]!") **/
export function detectImportantSuffix(raw: string): { line: string; isImportant: boolean } {
  let trimmed = raw.trim();
  let isImportant = false;
  if (trimmed.endsWith(']!')) {
    isImportant = true;
    trimmed = trimmed.slice(0, -1); // ตัด '!' ออก
  }
  return { line: trimmed, isImportant };
}
