// validateSwdDoc.ts
import * as vscode from 'vscode';

// สมมติเรามีฟังก์ชัน parse/generate ที่ไม่มี Side Effect ชื่อ generateSwdCssFromSource
// คุณอาจจะดึงมาจาก createSwdCssCommand.ts หรือสร้างเวอร์ชัน noSideEffect แยกก็ได้
// ในที่นี้จะอ้างถึงจากไฟล์เดียวกัน (ลิงก์แบบ relative)
import { generateSwdCssFromSource } from './createSwdCssCommand';

// validateSwdDoc: ตรวจสอบไฟล์ .swd.ts เพื่อดูว่ามี error ตอน parse หรือไม่
// - ถ้ามี error => ใส่ Diagnostic
// - ถ้าไม่มี => ลบ Diagnostic
export function validateSwdDoc(
  doc: vscode.TextDocument,
  diagCollection: vscode.DiagnosticCollection
) {
  // ลบ diagnostic เดิมของไฟล์นี้ก่อน
  diagCollection.delete(doc.uri);

  try {
    // ดึง source code ของไฟล์
    const sourceText = doc.getText();

    // เรียกฟังก์ชัน generateSwdCssFromSource เพื่อ parse
    // (โดยเวอร์ชันนี้จะ "ไม่" เขียนไฟล์ และ "ไม่" แก้ import)
    // แค่ parse + generate ดูว่ามี error หรือเปล่า
    generateSwdCssFromSource(sourceText);

    // ถ้า parse สำเร็จ => ไม่มี error => diagnostic ไม่ต้องใส่อะไร
    // (diagCollection.delete(doc.uri) เรียกไปแล้วข้างบน)
  } catch (err: any) {
    // ถ้าเกิด throw error => ใส่ diagnostic
    // ถ้าอยากเจาะจง lineNumber สามารถปรับจาก err.lineNumber (ถ้ามี)
    const diag: vscode.Diagnostic = {
      message: err.message,
      severity: vscode.DiagnosticSeverity.Error,
      source: 'Styledwind Validate',
      range: new vscode.Range(0, 0, 0, 0), // ระบุ range ให้เป็นบรรทัดแรกก่อน (หรือคำนวณเอง)
    };
    diagCollection.set(doc.uri, [diag]);
  }
}
