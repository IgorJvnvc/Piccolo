import { applyToDocument, createCapabilitiesStore } from '@/shared/device';
import { appBus } from '@/shared/events';
import { loadGsap } from '@/shared/motion';
import { createServices } from '@/shared/services';
import { enhancements } from './registry';
import { createScheduler } from './scheduler';

/**
 * Browser entry (the only script every visitor downloads). It:
 *   1. measures the device (the inline bootstrap already set the first values pre-paint),
 *   2. starts every enhancement that qualifies, at the right time,
 *   3. re-evaluates when capabilities change (resize, reduced-motion toggled, ...).
 */
function boot(): void {
  const store = createCapabilitiesStore(window);
  applyToDocument(document, store.get());

  const services = createServices({ bus: appBus });
  const scheduler = createScheduler(enhancements, { doc: document, services, gsap: loadGsap });
  scheduler.reconcile(store.get());

  store.subscribe((caps) => {
    applyToDocument(document, caps);
    appBus.emit('caps:changed', { caps });
    scheduler.reconcile(caps);
  });

  window.__PICCOLO_READY__ = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
