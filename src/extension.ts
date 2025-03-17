import * as vscode from 'vscode';
import {
  parseThemePaletteFull,
  parseThemeScreenDict,
  parseThemeFontDict,
  parseThemeKeyframeDict,
  parseThemeSpacingDict,
} from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations';
import { createBreakpointProvider } from './breakpointProvider';
import { createFontProvider } from './fontProvider';
import { createKeyframeProvider } from './keyframeProvider';
import { createSpacingProvider } from './spacingProvider';

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
        // parse palette, screen, font, keyframe, spacing
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

  // providers เดิม
  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  // providers ใหม่
  const breakpointProvider = createBreakpointProvider(screenDict);
  const fontProvider = createFontProvider(fontDict);
  const keyframeProvider = createKeyframeProvider(keyframeDict);
  const spacingProvider = createSpacingProvider(spacingDict);

  context.subscriptions.push(
    bracketProvider,
    dashProvider,
    hoverProvider,
    reversePropProvider,
    breakpointProvider,
    fontProvider,
    keyframeProvider,
    spacingProvider
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
