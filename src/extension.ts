import * as vscode from 'vscode';
import { parseThemePaletteFull, parseThemeScreenDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';
import { createInlayHintsProvider } from './inlayHintsProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

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

  // สร้าง provider เดิม ๆ
  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  // สร้าง provider ใหม่ Inlay Hints
  const inlayProvider = createInlayHintsProvider();

  // register => push เข้า context.subscriptions
  context.subscriptions.push(
    bracketProvider,
    dashProvider,
    hoverProvider,
    reversePropProvider,
    inlayProvider
  );
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
