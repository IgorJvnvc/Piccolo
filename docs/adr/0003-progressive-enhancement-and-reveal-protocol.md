# 0003. Progressive enhancement and the reveal protocol

Status: Accepted

## Context

Scroll entrances need elements to start hidden. Done carelessly this breaks three groups of visitors: those without
working JavaScript (content stays hidden), those who prefer reduced motion, and keyboard or screen-reader users.

An earlier version animated with GSAP's `autoAlpha`, which sets `visibility: hidden` while an element is hidden. That
turned out to be wrong: content with `visibility: hidden` **cannot take focus** and is removed from the accessibility
tree. Tabbing skipped controls inside not-yet-revealed sections (cards, links, menu tabs), and a focused control could
lose focus when its tween was created. It also made one end-to-end test flaky, because which "Details" button was
visible to the test depended on scroll-triggered timing.

## Decision

The **reveal protocol**:

1. Markup marks revealable elements with `data-reveal`.
2. `styles/base.css` hides them with `opacity: 0` (plus a small translate for `data-reveal="up"`), **only** under
   `html.js:not(.no-enhance)[data-motion='full' | 'lite']`.
3. A scene animates them to rest, sets `data-revealed` as soon as it starts (so the CSS pre-state hands over without a
   flash), then clears its inline styles.
4. **Reveal code animates `opacity` and `transform` only. It never sets `visibility` or uses `autoAlpha`.**
5. Reduced motion (`static` tier): the pre-state never applies. No JavaScript: nothing is hidden. If the runtime has not
   reported ready after 4 seconds, the inline bootstrap adds `html.no-enhance` and everything shows.
6. `html.no-enhance` is also the fallback for a dead island. When an island's code cannot be loaded, Astro fires
   `astro:hydration-error` (after its one retry) and the bootstrap sets the class at once: the menu shows every category
   stacked, and the controls that would do nothing (the card details buttons, the hamburger) are hidden, exactly as for a
   visitor without JavaScript.
7. A scene never hides what is already visible: one that starts after `no-enhance` is set does nothing, and one whose GSAP
   download has not arrived after 6 seconds gives up and opens its section (`recover`).

## Consequences

- Content is always focusable and exposed to assistive technology, whether or not it has been revealed yet.
- Rule 4 is enforced by an ESLint `no-restricted-syntax` rule on scene, behaviour and motion files, and rule 2/5 by
  end-to-end tests (progressive, reduced-motion and axe profiles).
- Elements that are still at `opacity: 0` can technically be clicked by pointer. That is acceptable: they sit below the
  fold until their scene fires.
