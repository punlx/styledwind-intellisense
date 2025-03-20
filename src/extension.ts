// extension.ts
import * as vscode from 'vscode';
import {
  parseThemePaletteFull,
  parseThemeScreenDict,
  parseThemeFontDict,
  parseThemeKeyframeDict,
  parseThemeSpacingDict,
} from './parseTheme';
import { createBracketProvider } from './suggestProviders'; // bracketProvider
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations';
import { createBreakpointProvider } from './breakpointProvider';
import { createFontProvider } from './fontProvider';
import { createKeyframeProvider } from './keyframeProvider';
import { createSpacingProvider } from './spacingProvider';
// <<<<<<<<<<<< ใหม่
import { createColorProvider } from './colorProvider';
import { createDirectiveProvider } from './directiveProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  let paletteColors: Record<string, Record<string, string>> = {};
  let screenDict: Record<string, string> = {};
  let fontDict: Record<string, string> = {};
  let keyframeDict: Record<string, string> = {};
  let spacingDict: Record<string, string> = {};

  if (vscode.workspace.workspaceFolders?.length) {
    try {
      const foundUris = await vscode.workspace.findFiles(
        '**/styledwind.theme.ts',
        '**/node_modules/**',
        1
      );
      if (foundUris.length > 0) {
        const themeFilePath = foundUris[0].fsPath;

        // parse
        paletteColors = parseThemePaletteFull(themeFilePath);
        screenDict = parseThemeScreenDict(themeFilePath);
        fontDict = parseThemeFontDict(themeFilePath);
        keyframeDict = parseThemeKeyframeDict(themeFilePath);
        spacingDict = parseThemeSpacingDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // provider ต่าง ๆ
  const bracketProvider = createBracketProvider();
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  // ของใหม่: colorProvider แยกชัดเจน
  const colorProvider = createColorProvider(paletteColors);

  // ของเดิม: breakpoint, font, keyframe, spacing
  const breakpointProvider = createBreakpointProvider(screenDict);
  const fontProvider = createFontProvider(fontDict);
  const keyframeProvider = createKeyframeProvider(keyframeDict);
  const spacingProvider = createSpacingProvider(spacingDict);

  //  directiveProvider
  const directiveProvider = createDirectiveProvider();

  context.subscriptions.push(
    bracketProvider,
    hoverProvider,
    reversePropProvider,
    colorProvider, // ใหม่
    breakpointProvider,
    fontProvider,
    keyframeProvider,
    spacingProvider,
    directiveProvider
  );

  // Decorations
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
