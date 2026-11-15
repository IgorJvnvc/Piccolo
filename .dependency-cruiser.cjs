/**
 * Module-graph rules for the TypeScript/TSX sources (dependency-cruiser cannot read .astro files, so the layer
 * policy itself lives in eslint.config.js where the Astro parser can see every import; this file guards what
 * ESLint is bad at: cycles, shipped code leaking dev dependencies, and imports that do not resolve).
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'A cycle makes load order matter and defeats lazy loading. Extract the shared part into a lower layer.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-dev-dependencies-in-shipped-code',
      severity: 'error',
      comment: 'Code under src/ ships to visitors. It may only import packages listed in "dependencies".',
      from: { path: '^src' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-test-code-in-shipped-code',
      severity: 'error',
      comment: 'Shipped code must not import anything from tests/.',
      from: { path: '^src' },
      to: { path: '^tests/' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Every import must resolve (Astro virtual modules such as astro:content are provided by the framework).',
      from: {},
      to: { couldNotResolve: true, pathNot: '^astro:' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    // Only our own ambient file. Excluding every .d.ts would also drop packages that resolve to their type
    // declarations (and with them every dev-dependency check).
    exclude: { path: ['^src/env\\.d\\.ts$'] },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
