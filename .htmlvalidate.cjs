/** Validates the BUILT html (dist/**), i.e. what visitors actually receive, including framework output. */
module.exports = {
  extends: ['html-validate:recommended'],

  // Astro injects its island runtime <style> into whichever element holds the first island.
  elements: ['html5', { style: { flow: true } }],

  rules: {
    // Astro and Preact print void elements self-closed; both spellings are valid HTML.
    'void-style': 'off',

    // role="list" on a styled <ul> is deliberate: Safari/VoiceOver drops list semantics under `list-style: none`.
    'no-redundant-role': ['error', { exclude: ['list'] }],

    // Motion server-renders the settled end state of its entrance animations as an inline style.
    'no-inline-style': ['error', { allowedProperties: ['opacity', 'transform'] }],

    // Phone numbers get non-breaking spaces in one place (nbsp() in composition, unit-tested). This rule also flags
    // tel: links whose text is a label ("Call now"), which cannot and should not contain them.
    'tel-non-breaking': 'off',
  },
};
