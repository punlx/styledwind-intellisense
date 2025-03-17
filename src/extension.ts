import * as vscode from 'vscode';
import { parseThemePaletteFull, parseThemeScreenDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations';

// ***** นำเข้าฟังก์ชัน provider ใหม่สำหรับ Breakpoints *****
import { createBreakpointProvider } from './breakpointProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // ----- ส่วนงานเดิม: parse theme (optional) -----
  let paletteColors: Record<string, Record<string, string>> = {};
  let screenDict: Record<string, string> = {};

  if (vscode.workspace.workspaceFolders?.length) {
    try {
      const foundUris = await vscode.workspace.findFiles(
        '**/styledwind.theme.ts',
        '**/node_modules/**',
        1
      );
      if (foundUris.length > 0) {
        const themeFilePath = foundUris[0].fsPath;
        paletteColors = parseThemePaletteFull(themeFilePath);
        screenDict = parseThemeScreenDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // ----- สร้าง provider จากไฟล์เดิม (suggestProviders, hoverProvider, etc.) -----
  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  // ***** สร้าง provider ใหม่สำหรับ Breakpoints (screen, container) *****
  const breakpointProvider = createBreakpointProvider(screenDict);

  // register
  context.subscriptions.push(
    bracketProvider,
    dashProvider,
    hoverProvider,
    reversePropProvider,
    breakpointProvider // ดัน provider ใหม่เข้าไป
  );

  // ----- ส่วนใหม่: ลงทะเบียน event สำหรับ Text Decorations -----
  // 1) เรียก updateDecorations ทันที ถ้ามี active editor
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }

  // 2) เวลาเปลี่ยน active editor
  const changeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });
  context.subscriptions.push(changeEditorDisposable);

  // 3) เวลาแก้ไขเอกสาร
  const changeDocDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });
  context.subscriptions.push(changeDocDisposable);

  // (เสร็จ)
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
