// extension.ts
import * as vscode from 'vscode';
import { parseThemePaletteFile, parseThemeScreenDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  let paletteColors: string[] = [];
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
        paletteColors = parseThemePaletteFile(themeFilePath);
        screenDict = parseThemeScreenDict(themeFilePath);
      }
    } catch (err) {
      console.error('Error parse theme =>', err);
    }
  }

  const bracketProvider = createBracketProvider();
  const dashProvider = createDashProvider(paletteColors);
  const hoverProvider = createHoverProvider(screenDict);

  context.subscriptions.push(bracketProvider, dashProvider, hoverProvider);
}

export function deactivate() {}
