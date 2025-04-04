// extension.ts
import * as vscode from 'vscode';

// (1) Import ฟังก์ชัน createSwdCssFile จาก createSwdCssCommand.ts
import { createSwdCssFile } from './createSwdCssCommand';

// (2) Import ตัวแปร generateGenericProvider (ซึ่งเป็น registerCommand อยู่แล้ว)
//     เพื่อนำไป push ลง context.subscriptions ให้ VSCode รู้จัก command "styledwind.generateGeneric"
import { generateGenericProvider } from './generateGenericProvider';

// ***** Import provider อื่น ๆ ตามปกติ *****
import {
  parseThemePaletteFull,
  parseThemeBreakpointDict,
  parseThemeTypographyDict,
  parseThemeKeyframeDict,
  parseThemeVariableDict,
  parseThemeDefine,
} from './parseTheme';

import { createCSSValueSuggestProvider } from './cssValueSuggestProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { updateDecorations } from './ghostTextDecorations';
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
import { createCssTsColorProvider, initPaletteMap } from './cssTsColorProvider';
import { createModeSuggestionProvider } from './modeSuggestionProvider';

// ghostSpacingDecorations
import { initSpacingMap, updateSpacingDecorations } from './ghostSpacingDecorations';
import { updateImportantDecorations } from './ghostImportantDecorations';
import { createDefineProvider } from './defineProvider';
import { createDefineTopKeyProvider } from './defineTopKeyProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // 1) Parse theme
  await initPaletteMap();

  let paletteColors: Record<string, Record<string, string>> = {};
  let screenDict: Record<string, string> = {};
  let fontDict: Record<string, string> = {};
  let keyframeDict: Record<string, string> = {};
  let spacingDict: Record<string, string> = {};
  let defineMap: Record<string, string[]> = {};

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
        screenDict = parseThemeBreakpointDict(themeFilePath);
        fontDict = parseThemeTypographyDict(themeFilePath);
        keyframeDict = parseThemeKeyframeDict(themeFilePath);
        spacingDict = parseThemeVariableDict(themeFilePath);
        defineMap = parseThemeDefine(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  // 2) สร้าง provider/completion อื่น ๆ ตามปกติ
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

  const defineProviderDisposable = createDefineProvider(defineMap);
  const defineTopKeyProviderDisposable = createDefineTopKeyProvider(defineMap);

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
    cssTsColorProviderDisposable,
    commentModeSuggestionProvider,
    defineProviderDisposable,
    defineTopKeyProviderDisposable
  );

  // 3) Init spacingMap
  initSpacingMap(spacingDict);

  // 4) Ghost Decorations
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
    updateSpacingDecorations(vscode.window.activeTextEditor);
    updateImportantDecorations(vscode.window.activeTextEditor);
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

  // ***** สำคัญ: push generateGenericProvider ลง subscriptions
  // (ทำให้ command "styledwind.generateGeneric" ทำงานได้)
  context.subscriptions.push(generateGenericProvider);

  // ***** สร้าง command ใหม่: "styledwind.createSwdCssAndGenerate"
  //     => 1) createSwdCssFile 2) เรียก command "styledwind.generateGeneric"
  const combinedCommand = vscode.commands.registerCommand(
    'styledwind.createSwdCssAndGenerate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }

      // (A) เรียก createSwdCssFile(doc)
      await createSwdCssFile(editor.document);

      // (B) เรียก command เดิม "styledwind.generateGeneric"
      //     จะใช้ activeTextEditor เดิม => generateGeneric
      await vscode.commands.executeCommand('styledwind.generateGeneric');

      vscode.window.showInformationMessage('Created .swd.css and Generated Generic done!');
    }
  );
  context.subscriptions.push(combinedCommand);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
