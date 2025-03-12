// extension.ts
import * as vscode from 'vscode';
import { parseThemePaletteFile, parseThemeScreenDict } from './parseTheme';
import { createBracketProvider, createDashProvider } from './suggestProviders';
import { createHoverProvider } from './hoverProvider';
import { createReversePropertyProvider } from './reversePropertyProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Styledwind Intellisense is now active!');

  let paletteColors: string[] = [];
  let screenDict: Record<string, string> = {};

  // 1) ค้นหา styledwind.theme.ts ใน workspace (ถ้ามี)
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

  // 2) สร้าง providers ต่าง ๆ
  const bracketProvider = createBracketProvider(); // สำหรับ abbr[...]
  const dashProvider = createDashProvider(paletteColors); // สำหรับ abbr[...] + -- (color var)
  const hoverProvider = createHoverProvider(screenDict); // สำหรับ hover ขึ้น style
  const reversePropProvider = createReversePropertyProvider(); // สำหรับ suggest property-name => abbr

  // 3) ลงทะเบียน
  context.subscriptions.push(bracketProvider, dashProvider, hoverProvider, reversePropProvider);
}

export function deactivate() {
  console.log('Styledwind Intellisense is now deactivated.');
}
