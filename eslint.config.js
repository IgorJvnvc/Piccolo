import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/*
 * Lint = correctness + the architecture rules in docs/architecture.md.
 *   1. Layering            -> boundaries/dependencies (who may import whom)
 *   2. Single owners       -> restricted imports (gsap, motion, lenis, astro:content, astro:assets, import.meta.env)
 *   3. Motion safety       -> no `visibility` toggling in reveal code (hidden content cannot take focus)
 *   4. Accessibility       -> jsx-a11y for Astro and Preact markup
 */

const SOURCE = ['src/**/*.{ts,tsx,astro}'];

// ---------------------------------------------------------------------------------------------------------------
// 2 + 3. Restrictions, built per file group so every exception is explicit and reviewable.
// ---------------------------------------------------------------------------------------------------------------

const MESSAGES = {
  env: 'Read environment values through "@/shared/config". shared/config/env.ts is the only module that touches import.meta.env.',
  gsap: 'Load GSAP through the shared kit ("@/shared/motion"). shared/motion/gsap.ts is the only module that imports it (one lazy chunk).',
  motion: 'Use Motion through "@/shared/motion/motion-react" (one shared, tree-shaken entry for islands).',
  lenis: 'Lenis belongs to features/smooth-scroll. Other code asks for scrolling through the bus ("scroll:to").',
  astroContent: 'Read content through the repository ports in "@/infrastructure/content", never through astro:content directly.',
  astroAssets: 'astro:assets is an infrastructure concern: use the image catalog ("@/infrastructure/images") or the layout Font component.',
  visibility:
    'Do not animate or set `visibility`/`autoAlpha` in reveal code: hidden content cannot take keyboard focus and is dropped from the accessibility tree. Animate `opacity` and `transform` only.',
};

/**
 * @param {{ env?: boolean, gsap?: boolean, motion?: boolean, lenis?: boolean, astroContent?: boolean, astroAssets?: boolean, visibility?: boolean }} allow
 *        `true` = this group MAY use the thing. For `visibility`, `true` = the ban applies.
 */
function restrictions(allow = {}) {
  const syntax = [];
  if (!allow.env) {
    syntax.push({ selector: "MemberExpression[object.type='MetaProperty'][property.name='env']", message: MESSAGES.env });
  }
  if (!allow.gsap) {
    syntax.push({ selector: 'ImportExpression[source.value=/^gsap(\\/|$)/]', message: MESSAGES.gsap });
  }
  if (!allow.lenis) {
    syntax.push({ selector: 'ImportExpression[source.value=/^lenis(\\/|$)/]', message: MESSAGES.lenis });
  }
  if (allow.visibility) {
    syntax.push(
      { selector: "Property[key.name='autoAlpha']", message: MESSAGES.visibility },
      { selector: "Property[key.name='visibility']", message: MESSAGES.visibility },
      { selector: "Property[key.value='autoAlpha']", message: MESSAGES.visibility },
      { selector: "Property[key.value='visibility']", message: MESSAGES.visibility },
    );
  }

  // Exact module names go in `paths`; sub-path imports ("gsap/ScrollTrigger") in anchored `regex` patterns.
  // (`group` patterns are gitignore-style and would also match our own "@/shared/motion" folder.)
  const paths = [];
  const patterns = [];
  if (!allow.gsap) {
    paths.push({ name: 'gsap', message: MESSAGES.gsap });
    patterns.push({ regex: '^gsap/', message: MESSAGES.gsap });
  }
  if (!allow.motion) {
    paths.push({ name: 'motion', message: MESSAGES.motion }, { name: 'framer-motion', message: MESSAGES.motion });
    patterns.push({ regex: '^(motion|framer-motion)/', message: MESSAGES.motion });
  }
  if (!allow.lenis) {
    paths.push({ name: 'lenis', message: MESSAGES.lenis });
    patterns.push({ regex: '^lenis/', message: MESSAGES.lenis });
  }
  if (!allow.astroContent) paths.push({ name: 'astro:content', message: MESSAGES.astroContent });
  if (!allow.astroAssets) paths.push({ name: 'astro:assets', message: MESSAGES.astroAssets });

  return {
    'no-restricted-syntax': ['error', ...syntax],
    'no-restricted-imports': ['error', { paths, patterns }],
  };
}

// Later entries win. Every entry states ALL its flags, so nothing is inherited by accident.
const MOTION_FILES = ['src/**/*.{scene,behavior}.ts', 'src/shared/motion/**/*.{ts,tsx}'];

const restrictionGroups = [
  { files: SOURCE, allow: {} },
  { files: MOTION_FILES, allow: { visibility: true } },
  { files: ['src/shared/config/env.ts'], allow: { env: true } },
  { files: ['src/shared/motion/gsap.ts'], allow: { gsap: true, visibility: true } },
  { files: ['src/shared/motion/motion-react.tsx', 'src/shared/motion/motion-features.ts'], allow: { motion: true, visibility: true } },
  { files: ['src/features/smooth-scroll/**/*.ts'], allow: { lenis: true, visibility: true } },
  { files: ['src/infrastructure/content/**/*.ts', 'src/content.config.ts'], allow: { astroContent: true } },
  { files: ['src/infrastructure/images/**/*.ts', 'src/layouts/**/*.astro'], allow: { astroAssets: true } },
];

// ---------------------------------------------------------------------------------------------------------------
// 1. Layering.  pages -> layouts -> sections -> features -> entities -> shared
//               infrastructure sits behind entity ports; composition is the build-time root.
// ---------------------------------------------------------------------------------------------------------------

const elements = [
  { type: 'page', pattern: 'src/pages', partialMatch: false },
  { type: 'layout', pattern: 'src/layouts', partialMatch: false },
  { type: 'section', pattern: 'src/sections/*', partialMatch: false, capture: ['name'] },
  { type: 'feature', pattern: 'src/features/*', partialMatch: false, capture: ['name'] },
  { type: 'entity', pattern: 'src/entities/*', partialMatch: false, capture: ['name'] },
  { type: 'infrastructure', pattern: 'src/infrastructure', partialMatch: false },
  { type: 'composition', pattern: 'src/composition', partialMatch: false },
  { type: 'runtime', pattern: 'src/runtime', partialMatch: false },
  { type: 'shared', pattern: 'src/shared', partialMatch: false },
  { type: 'styles', pattern: 'src/styles', partialMatch: false },
];

/** `from` may import `to` (and its own element). Anything not listed is an error. */
const mayImport = (from, ...to) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: to } } },
});

const layerPolicies = [
  mayImport('page', 'layout', 'section', 'feature', 'composition', 'shared', 'styles'),
  mayImport('layout', 'runtime', 'shared', 'styles'),
  mayImport('section', 'entity', 'feature', 'shared'),
  mayImport('feature', 'entity', 'shared'),
  mayImport('entity', 'shared'),
  mayImport('infrastructure', 'entity', 'shared'),
  mayImport('composition', 'entity', 'infrastructure', 'section', 'shared'),
  mayImport('runtime', 'shared'),
  mayImport('shared'),
];

export default defineConfig(
  globalIgnores([
    'dist/**',
    '.astro/**',
    'node_modules/**',
    'reference/**',
    '.shots/**',
    'test-results/**',
    'playwright-report/**',
    // Throwaway developer tooling (screenshots, overlays); not shipped, not architecture.
    'scripts/dev/**',
  ]),

  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs['flat/recommended'],
  astro.configs['flat/jsx-a11y-recommended'],

  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // Preact islands: hooks rules (only the two that matter; the React Compiler rules do not apply to Preact).
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Preact markup accessibility (Astro markup is covered by the astro jsx-a11y config above).
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.configs.recommended,
  },

  // `role="list"` on a styled <ul>/<ol> is deliberate, not redundant: Safari/VoiceOver drops list semantics
  // when `list-style: none` is applied, and the role restores them.
  {
    files: ['src/**/*.tsx'],
    rules: { 'jsx-a11y-x/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }] },
  },
  {
    files: ['src/**/*.astro'],
    rules: { 'astro/jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }] },
  },

  // 2 + 3. Single owners and motion safety.
  ...restrictionGroups.map(({ files, allow }) => ({ files, rules: restrictions(allow) })),

  // 1. Layering.
  {
    files: SOURCE,
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' } },
      'boundaries/ignore': ['src/content.config.ts', 'src/env.d.ts'],
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: layerPolicies,
        },
      ],
      'boundaries/no-unknown-files': 'error',
    },
  },

  // Tests may poke at internals and use what they need.
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Build-time scripts report progress on the console.
  {
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
);
