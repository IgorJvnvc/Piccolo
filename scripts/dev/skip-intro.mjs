/**
 * The entry intro covers the page for about five seconds. The dev tools measure the page, so they mark the intro as seen, the way
 * tests/e2e/fixtures.ts does for the specs. (shoot.mjs takes --intro to leave it on.)
 */
export function skipIntro(context) {
  return context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('piccolo:intro', 'seen');
    } catch {
      // an opaque origin has no storage
    }
  });
}