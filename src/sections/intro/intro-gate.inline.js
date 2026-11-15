/*
 * Entry-intro gate. Inlined as the first thing in <body> (see Intro.astro), so html[data-intro] is set before anything below it is
 * styled or painted and the landing page never flashes in front of the overlay. Plain ES5 on purpose, like the head bootstrap it
 * follows (src/shared/device/bootstrap.inline.js, which has already set html[data-motion]).
 *
 * No attribute, no intro, and the page is exactly what it was: without JavaScript, with reduced motion, with forced colours,
 * on a deep link (/#menu) or when the visitor, or the test harness, has marked the intro as seen.
 */
(function (win, doc) {
  var root = doc.documentElement;
  try {
    if (root.getAttribute('data-motion') === 'static') return;
    if (win.location.hash) return;
    if (win.matchMedia('(forced-colors: active)').matches) return;
    if (win.sessionStorage.getItem('piccolo:intro') === 'seen') return;
  } catch (e) {
    // matchMedia or storage is blocked: play the intro anyway.
  }
  root.setAttribute('data-intro', '');
})(window, document);
