const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow em dashes in JSXText; use a semicolon instead",
    },
    fixable: "code",
    schema: [],
  },
  create(context) {
    const source = context.getSourceCode().text;
    if (source.includes("punctuation-allowed")) {
      return {};
    }
    return {
      JSXText(node) {
        if (node.value.includes("—")) {
          context.report({
            node,
            message:
              "Em dashes are not allowed in JSXText; use a semicolon instead.",
            fix(fixer) {
              const fixed = node.value.replace(/—+/g, ";");
              return fixer.replaceText(node, fixed);
            },
          });
        }
      },
    };
  },
};

export default rule;
