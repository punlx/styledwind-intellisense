// extension.ts
import * as vscode from 'vscode';
import {
  parseThemePaletteFull,
  parseThemeBreakpointDict,
  parseThemeTypographyDict,
  parseThemeKeyframeDict,
  parseThemeVariableDict,
} from './parseTheme';

import { createCSSValueSuggestProvider } from './cssValueSuggestProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations'; // ของเดิม (abbr ghost)
import { createBreakpointProvider } from './breakpointProvider';
import { createFontProvider } from './typographyProvider';
import { createKeyframeProvider } from './keyframeProvider';
import { createSpacingProvider } from './variableProvider';
import { createBindClassProvider } from './createBindClassProvider';
import { createColorProvider } from './colorProvider';
import { createDirectiveProvider } from './directiveProvider';
import { createSwdSnippetProvider } from './createSwdSnippetProvider';
import { createUseConstProvider } from './createUseConstProvider';
import { createLocalVarProvider } from './localVarProvider';
import { createStyledwindThemeColorProvider } from './themePaletteColorProvider';
import { generateGenericProvider } from './generateGenericProvider';
import { createCssTsColorProvider, initPaletteMap } from './cssTsColorProvider';
import { createModeSuggestionProvider } from './modeSuggestionProvider';

// *** Import ghostSpacingDecorations
import { initSpacingMap, updateSpacingDecorations } from './ghostSpacingDecorations';

// *** Import ghostImportantDecorations
import { updateImportantDecorations } from './ghostImportantDecorations';
import { createQueryPseudoProvider } from './createQueryPseudoProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // 1) โหลด palette จาก styledwind.theme.ts (ถ้าเจอ)
  await initPaletteMap();

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
        screenDict = parseThemeBreakpointDict(themeFilePath);
        fontDict = parseThemeTypographyDict(themeFilePath);
        keyframeDict = parseThemeKeyframeDict(themeFilePath);
        spacingDict = parseThemeVariableDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // 2) สร้าง provider ต่าง ๆ
  const bracketProvider = createCSSValueSuggestProvider();
  const reversePropProvider = createReversePropertyProvider();
  const colorProvider = createColorProvider(paletteColors);
  const breakpointProvider = createBreakpointProvider(screenDict);
  const fontProvider = createFontProvider(fontDict);
  const keyframeProvider = createKeyframeProvider(keyframeDict);
  const spacingProvider = createSpacingProvider(spacingDict);
  const directiveProvider = createDirectiveProvider();
  const bindClassProvider = createBindClassProvider();
  const swdSnippetProvider = createSwdSnippetProvider();
  const useConstProvider = createUseConstProvider();
  const localVarProviderDisposable = createLocalVarProvider();
  const paletteProvider = createStyledwindThemeColorProvider();
  const cssTsColorProviderDisposable = createCssTsColorProvider();
  const commentModeSuggestionProvider = createModeSuggestionProvider();
  const queryPseudoProvider = createQueryPseudoProvider();
  context.subscriptions.push(
    localVarProviderDisposable,
    bracketProvider,
    reversePropProvider,
    colorProvider,
    breakpointProvider,
    fontProvider,
    keyframeProvider,
    spacingProvider,
    directiveProvider,
    bindClassProvider,
    swdSnippetProvider,
    useConstProvider,
    paletteProvider,
    generateGenericProvider,
    cssTsColorProviderDisposable,
    commentModeSuggestionProvider,
    queryPseudoProvider
  );

  // 3) Init spacingMap => เพื่อใช้ใน ghostSpacingDecorations
  //    เอา spacingDict ที่ parse ได้ -> ใส่ initSpacingMap
  initSpacingMap(spacingDict);

  // 4) Ghost Decorations
  //   - abbr ghost: updateDecorations
  //   - spacing ghost: updateSpacingDecorations
  //   - important ghost: updateImportantDecorations

  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor); // abbr ghost
    updateSpacingDecorations(vscode.window.activeTextEditor); // spacing ghost
    updateImportantDecorations(vscode.window.activeTextEditor); // "!important" ghost
  }

  const changeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
      updateSpacingDecorations(editor);
      updateImportantDecorations(editor);
    }
  });
  context.subscriptions.push(changeEditorDisposable);

  const changeDocDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
      updateSpacingDecorations(editor);
      updateImportantDecorations(editor);
    }
  });
  context.subscriptions.push(changeDocDisposable);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
