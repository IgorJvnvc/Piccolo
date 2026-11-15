/*
 * Entry-intro gate. Inlined as the first thing in <body> (see Intro.astro), so html[data-intro] is set before anything below it is
 * styled or painted and the landing page never flashes in front of the overlay. Plain ES5 on purpose, like the head bootstrap it
 * follows (src/shared/device/bootstrap.inline.js, which has already set html[data-motion]).
 *
 * No attribute, no intro, and the page is exactly what it was: without JavaScript, with reduced motion, with forced colours,
 * or when the test harness has marked the intro as seen.
 *
 * When the intro does play, the page starts at its top, because the intro ends on the landing page: scroll restoration is turned
 * off (a reload would otherwise put the visitor back where they were) and a #hash is dropped from the URL (the page writes one
 * itself whenever an in-page link is used, so a reload would otherwise scroll to a section behind the overlay).
 */
(function (win, doc) {
  var root = doc.documentElement;
  try {
    if (root.getAttribute('data-motion') === 'static') return;
    if (win.matchMedia('(forced-colors: active)').matches) return;
    if (win.sessionStorage.getItem('piccolo:intro') === 'seen') return;
  } catch (e) {
    // matchMedia or storage is blocked: play the intro anyway.
  }
  try {
    win.history.scrollRestoration = 'manual';
    if (win.location.hash) win.history.replaceState(null, '', win.location.pathname + win.location.search);
  } catch (e) {
    // no history API to steer: the browser keeps its own idea of where the page starts.
  }
  root.setAttribute('data-intro', '');
})(window, document);