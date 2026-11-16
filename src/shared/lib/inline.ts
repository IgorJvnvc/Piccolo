/**
 * An inline script ships in every page, so its comments stay in the source file and out of the HTML: block comments,
 * whole-line comments and blank lines go. This is not a minifier: a `//` after code, or inside a string, is left alone.
 */
export function compactScript(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n').trim();
}
