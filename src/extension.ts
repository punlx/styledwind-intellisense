import * as vscode from 'vscode';
import { parseThemePaletteFull, parseThemeScreenDict, parseThemeFontDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations';
import { createBreakpointProvider } from './breakpointProvider';
import { createFontProvider } from './fontProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // ----- ส่วนงานเดิม: parse theme -----
  let paletteColors: Record<string, Record<string, string>> = {};
  let screenDict: Record<string, string> = {};
  let fontDict: Record<string, string> = {};

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
        fontDict = parseThemeFontDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // ----- สร้าง provider เดิม (suggestProviders, hoverProvider, etc.) -----
  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  // ----- Provider ใหม่ (breakpoint, font) -----
  const breakpointProvider = createBreakpointProvider(screenDict);
  const fontProvider = createFontProvider(fontDict);

  // register
  context.subscriptions.push(
    bracketProvider,
    dashProvider,
    hoverProvider,
    reversePropProvider,
    breakpointProvider,
    fontProvider
  );

  // ----- ส่วน Text Decorations -----
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }

  const changeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });
  context.subscriptions.push(changeEditorDisposable);

  const changeDocDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });
  context.subscriptions.push(changeDocDisposable);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
