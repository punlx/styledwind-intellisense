// extension.ts

import * as vscode from 'vscode'; // <<--- สำคัญสำหรับการใช้ vscode namespace

import { parseThemePaletteFull, parseThemeScreenDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';

// อย่าลืม import createHoverProvider
import { createHoverProvider } from './hoverProvider';

// อย่าลืม import createReversePropertyProvider
import { createReversePropertyProvider } from './reversePropertyProvider';

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

        // ใช้ parseThemePaletteFull เพื่อให้ได้ object สำหรับจัดการสี
        paletteColors = parseThemePaletteFull(themeFilePath);
        screenDict = parseThemeScreenDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);
  const reversePropProvider = createReversePropertyProvider();

  context.subscriptions.push(bracketProvider, dashProvider, hoverProvider, reversePropProvider);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
