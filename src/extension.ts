// extension.ts
import * as vscode from 'vscode';

// --- (NEW) import createStyledwindThemeCssFile ---
import { createSwdThemeCssFile } from './generateCssCommand/createSwdThemeCssCommand';

// import validateSwdDoc.ts ซึ่งไว้ parse-check ใส่ Diagnostic
import { validateSwdDoc } from './generateCssCommand/validateSwdDoc';

// import createSwdCssFile (จากโค้ดข้างบน)
import { createSwdCssFile } from './generateCssCommand/createSwdCssCommand';

// generateGenericProvider (command "styledwind.generateGeneric")
import { generateGenericProvider } from './generateGenericProvider';

/* -------------------------------------------------------------------------
   provider / parseTheme / etc. ...
------------------------------------------------------------------------- */
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

  // สร้าง DiagnosticCollection สำหรับ validate
  const styledwindDiagnosticCollection = vscode.languages.createDiagnosticCollection('styledwind');
  context.subscriptions.push(styledwindDiagnosticCollection);

  // parse theme ...
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

  // register providers ...
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

  initSpacingMap(spacingDict);

  // ตกแต่ง GhostText / Decorator
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

  // push generateGenericProvider
  context.subscriptions.push(generateGenericProvider);

  // --------------------------------------------------------------------------------
  // สแกนไฟล์ .swd.ts ทั้งหมด -> validateSwdDoc
  // --------------------------------------------------------------------------------
  const swdUris = await vscode.workspace.findFiles('**/*.swd.ts', '**/node_modules/**');
  for (const uri of swdUris) {
    const doc = await vscode.workspace.openTextDocument(uri);
    validateSwdDoc(doc, styledwindDiagnosticCollection);
  }

  // --------------------------------------------------------------------------------
  // เมื่อ save ไฟล์ .swd.ts => validate ใหม่ ถ้าไม่ error => generate
  // --------------------------------------------------------------------------------
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
    if (savedDoc.fileName.endsWith('.swd.ts')) {
      // validate
      validateSwdDoc(savedDoc, styledwindDiagnosticCollection);

      // check ถ้ายังมี error => ไม่ generate
      const diags = styledwindDiagnosticCollection.get(savedDoc.uri);
      const hasErr = diags && diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error);
      if (hasErr) {
        return;
      }

      // ถ้าไม่มี error => createSwdCssFile
      try {
        await createSwdCssFile(savedDoc);
      } catch (err) {
        return;
      }

      // no error => styledwind.generateGeneric
      await vscode.commands.executeCommand('styledwind.generateGeneric');
      // vscode.window.showInformationMessage('Created .swd.css and Generated Generic done!');
    }
  });
  context.subscriptions.push(saveDisposable);

  // --------------------------------------------------------------------------------
  // Command สร้างไฟล์ .swd.css และ generate
  // --------------------------------------------------------------------------------
  const combinedCommand = vscode.commands.registerCommand(
    'styledwind.createSwdCssAndGenerate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }

      validateSwdDoc(editor.document, styledwindDiagnosticCollection);
      const diags = styledwindDiagnosticCollection.get(editor.document.uri);
      const hasErr = diags && diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error);
      if (hasErr) {
        return;
      }

      try {
        await createSwdCssFile(editor.document);
      } catch (err) {
        return;
      }

      await vscode.commands.executeCommand('styledwind.generateGeneric');
    }
  );
  context.subscriptions.push(combinedCommand);

  // --------------------------------------------------------------------------------
  // (NEW) เมื่อ save ไฟล์ styledwind.theme.ts => generate styledwind.theme.css
  // --------------------------------------------------------------------------------
  const themeSaveDisposable = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
    if (savedDoc.fileName.endsWith('styledwind.theme.ts')) {
      try {
        // (คุณจะ validate อะไรก่อนก็ได้)
        await createSwdThemeCssFile(savedDoc);
        vscode.window.showInformationMessage('styledwind.theme.css generated successfully!');
      } catch (error) {
        // handle error
        console.error('Error generating styledwind.theme.css =>', error);
      }
    }
  });
  context.subscriptions.push(themeSaveDisposable);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
