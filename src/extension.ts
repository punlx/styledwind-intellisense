// extension.ts
import * as vscode from 'vscode';

// 1) Import ฟังก์ชัน createSwdCssFile (ที่คุณอัปเดตแล้ว)
//    โดยเราจะส่ง DiagnosticCollection เข้าไปด้วย
import { createSwdCssFile } from './generateCssCommand/createSwdCssCommand';

// 2) สมมติคุณมี generateGenericProvider เป็น command อยู่แล้ว
import { generateGenericProvider } from './generateGenericProvider';

// --------------------------------------------------------------------------------
// ส่วนที่เหลือคือ imports ของ provider ต่าง ๆ ในโปรเจกต์คุณ
// (ยกตัวอย่างตามโค้ดของคุณที่กล่าวถึง parseTheme*, createXXXProvider, ฯลฯ)
// --------------------------------------------------------------------------------
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
import { createQueryPseudoProvider } from './createQueryPseudoProvider';
import { initSpacingMap, updateSpacingDecorations } from './ghostSpacingDecorations';
import { updateImportantDecorations } from './ghostImportantDecorations';
import { createDefineProvider } from './defineProvider';
import { createDefineTopKeyProvider } from './defineTopKeyProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  // --------------------------------------------------------------------------------
  // 1) สร้าง DiagnosticCollection สำหรับ Styledwind
  // --------------------------------------------------------------------------------
  const styledwindDiagnosticCollection = vscode.languages.createDiagnosticCollection('styledwind');
  context.subscriptions.push(styledwindDiagnosticCollection);

  // --------------------------------------------------------------------------------
  // 2) Parse theme (เช่นไฟล์ styledwind.theme.ts) เพื่อให้ provider ต่าง ๆ ใช้
  // --------------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------------
  // 3) สร้าง / Register providers และ completions ต่าง ๆ
  // --------------------------------------------------------------------------------
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
    cssTsColorProviderDisposable,
    commentModeSuggestionProvider,
    defineProviderDisposable,
    defineTopKeyProviderDisposable,
    queryPseudoProvider
  );

  // --------------------------------------------------------------------------------
  // 4) Init spacingMap + decorations (ghost text)
  // --------------------------------------------------------------------------------
  initSpacingMap(spacingDict);

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

  // --------------------------------------------------------------------------------
  // 5) นำ command "styledwind.generateGeneric" จาก generateGenericProvider มาลง
  // --------------------------------------------------------------------------------
  context.subscriptions.push(generateGenericProvider);

  // --------------------------------------------------------------------------------
  // 6) สร้าง command ใหม่: "styledwind.createSwdCssAndGenerate"
  //    - เรียก createSwdCssFile => ถ้า error => throw => หยุด
  //    - ถ้าไม่มี error => เรียก command "styledwind.generateGeneric"
  // --------------------------------------------------------------------------------
  const combinedCommand = vscode.commands.registerCommand(
    'styledwind.createSwdCssAndGenerate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }

      try {
        // เรียก createSwdCssFile พร้อมส่ง diagnosticCollection เข้าไป
        await createSwdCssFile(editor.document, styledwindDiagnosticCollection);
      } catch (err: any) {
        // ถ้า error => จบ => ไม่เรียกคำสั่ง generateGeneric ต่อ
        return;
      }

      // ถ้าไม่ error => สั่ง generateGeneric
      await vscode.commands.executeCommand('styledwind.generateGeneric');
      vscode.window.showInformationMessage('Created .swd.css and Generated Generic done!');
    }
  );
  context.subscriptions.push(combinedCommand);

  // --------------------------------------------------------------------------------
  // 7) Auto-run command ตอน save => ถ้าเป็นไฟล์ .swd.ts => เรียก "styledwind.createSwdCssAndGenerate"
  // --------------------------------------------------------------------------------
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
    if (savedDoc.fileName.endsWith('.swd.ts')) {
      await vscode.commands.executeCommand('styledwind.createSwdCssAndGenerate');
    }
  });
  context.subscriptions.push(saveDisposable);
}

// --------------------------------------------------------------------------------
// ฟังก์ชัน deactivate
// --------------------------------------------------------------------------------
export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
