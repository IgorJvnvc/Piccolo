/*
 * Pre-paint bootstrap. Inlined in <head> (see BaseLayout) so CSS can branch on device/motion BEFORE
 * first paint and there is no layout flash.
 *
 * - Plain ES5 on purpose: it must run on ancient TV browsers.
 * - Mirrors src/shared/device/classify.ts (a parity test runs both on the same inputs).
 * - Failsafe: if the enhancement runtime never reports ready, content is revealed anyway.
 */
(function (win, doc) {
  var root = doc.documentElement;
  var nav = win.navigator || {};
  var ua = nav.userAgent || '';

  function media(query) {
    try {
      return !!(win.matchMedia && win.matchMedia(query).matches);
    } catch (e) {
      return false;
    }
  }

  var width = win.innerWidth || 0;
  var height = win.innerHeight || 0;
  var hover = media('(hover: hover)');
  var fine = media('(pointer: fine)');
  var coarse = media('(pointer: coarse)');
  var reduced = media('(prefers-reduced-motion: reduce)');
  var saveData = !!(nav.connection && nav.connection.saveData === true);
  var cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined;
  var memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;

  var pointer = fine ? 'fine' : coarse ? 'coarse' : 'none';

  var tvUa =
    /(smart-?tv|tizen|web0s|webos|hbbtv|netcast|appletv|crkey|bravia|sonydtv|vidaa|roku|hisense|philipstv|googletv|android tv|\bgtv\b)/i.test(ua) ||
    /\bAFT[A-Z]{1,5}\b/.test(ua);

  var device;
  if (tvUa || (pointer === 'none' && !hover && width >= 1920)) {
    device = 'tv';
  } else if (pointer === 'coarse' && !hover) {
    device = Math.min(width, height) < 600 ? 'phone' : 'tablet';
  } else if (width >= 1440) {
    device = 'desktop';
  } else if (width >= 1024) {
    device = 'laptop';
  } else {
    device = 'tablet';
  }

  var lowEnd = (cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 2);
  var motion = reduced ? 'static' : device === 'tv' || saveData || lowEnd ? 'lite' : 'full';

  root.className += (root.className ? ' ' : '') + 'js';
  root.setAttribute('data-device', device);
  root.setAttribute('data-motion', motion);
  root.setAttribute('data-pointer', pointer);

  // Failsafe: never leave content hidden if the runtime fails to boot.
  win.setTimeout(function () {
    if (!win.__PICCOLO_READY__) root.className += ' no-enhance';
  }, 4000);
})(window, document);
