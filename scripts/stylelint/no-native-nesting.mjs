import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'piccolo/no-native-nesting';

const messages = ruleMessages(ruleName, {
  rule: (selector) =>
    `Native CSS nesting ("${selector}") is not supported on the Chromium 94 baseline. Write the full selector instead.`,
  atRule: (name) =>
    `"@${name}" nested inside a rule needs native nesting (Chromium 120+). Put it at the top level and repeat the selector inside.`,
});

/** Rules and conditional at-rules must be top level: native nesting is not available on the browser floor. */
const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary })) return;

  root.walkRules((node) => {
    if (node.parent?.type !== 'rule') return;
    report({ ruleName, result, node, message: messages.rule(node.selector) });
  });

  root.walkAtRules((node) => {
    if (node.parent?.type !== 'rule') return;
    report({ ruleName, result, node, message: messages.atRule(node.name) });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { fixable: false };

export default createPlugin(ruleName, rule);
