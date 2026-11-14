import noNativeNesting from './scripts/stylelint/no-native-nesting.mjs';

/*
 * CSS conventions (docs/architecture.md, "Styling"):
 *   - Colours, shadows and effects come from design tokens (src/styles/tokens.css), never raw values.
 *   - The browser floor is Chromium 94 / Safari 15 / Firefox 100, so newer CSS is rejected at lint time:
 *     no @layer, @container, @scope, :has(), dynamic viewport units, color-mix(), nesting, individual transforms...
 *     A newer value may still refine an older declaration written right above it (cascade fallback); say so with
 *     an inline `stylelint-disable-next-line <rule> -- <reason>`.
 *   - CSS Modules: class names are camelCase and private, :global() is allowed for html-level state hooks.
 */

const FUNCTIONS_FROM_TOKENS_ONLY = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended'],
  plugins: [noNativeNesting],
  rules: {
    // Overrides for device, motion-state and idle-state hooks are intentionally MORE specific than the base
    // rule and grouped by concern, not by specificity, so this ordering heuristic only produces noise here.
    'no-descending-specificity': null,

    // CSS Modules
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global', 'local'] }],
    'property-no-unknown': [true, { ignoreProperties: ['composes'] }],

    // Tokens only
    'color-no-hex': true,
    'function-disallowed-list': [
      ...FUNCTIONS_FROM_TOKENS_ONLY,
      // Newer than the browser floor
      'color-mix',
      'light-dark',
      'round',
      'mod',
      'rem',
      'anchor',
    ],

    // Browser floor
    'at-rule-disallowed-list': ['layer', 'container', 'scope', 'starting-style', 'view-transition'],
    'selector-pseudo-class-disallowed-list': ['has', 'is', 'popover-open', 'user-invalid', 'user-valid'],
    'unit-disallowed-list': ['dvh', 'dvw', 'dvi', 'dvb', 'svh', 'svw', 'svi', 'svb', 'lvh', 'lvw', 'lvi', 'lvb', 'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax'],
    'property-disallowed-list': [
      'translate',
      'scale',
      'rotate',
      'animation-timeline',
      'view-transition-name',
      'interpolate-size',
      'field-sizing',
      'anchor-name',
      'position-anchor',
    ],
    'piccolo/no-native-nesting': true,
  },
  overrides: [
    {
      // The one place raw colour values and colour functions belong.
      files: ['src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': ['color-mix', 'light-dark', 'round', 'mod', 'rem', 'anchor'],
      },
    },
  ],
};
