export function ensureScopeUnique(scopeName: string) {
  // ถ้า scopeName==='none' => ข้าม
  if (scopeName === 'none') return;

  // ถ้าเคยมี => throw หรือจะ console.warn ก็แล้วแต่
  // if (usedScopes.has(scopeName)) {
  //   throw new Error(`[SWD-ERR] scope "${scopeName}" was already used in another file.`);
  // }
  // usedScopes.add(scopeName);
}
