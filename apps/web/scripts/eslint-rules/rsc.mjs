// Local ESLint plugin: forbid JSX event handlers in React Server Components
// Provides suggestions to insert 'use client' or remove the offending attribute

const rscPlugin = {
  rules: {
    "no-jsx-events-in-server-components": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow JSX event handlers (e.g. onClick) in Server Components. Use 'use client' to enable them.",
        },
        schema: [],
        hasSuggestions: true,
        messages: {
          noEventInRSC:
            "JSX event handler '{{name}}' is not allowed in a Server Component. Add 'use client' at the top of the file or remove the handler.",
        },
      },
      create(context) {
        let isClientComponent = false;
        let programNode = null;

        function hasUseClientDirective(program) {
          for (const statement of program.body) {
            if (statement.type === "EmptyStatement") continue;
            if (
              statement.type === "ExpressionStatement" &&
              statement.expression &&
              statement.expression.type === "Literal" &&
              typeof statement.expression.value === "string"
            ) {
              if (statement.expression.value === "use client") return true;
              continue;
            }
            break;
          }
          return false;
        }

        return {
          Program(node) {
            programNode = node;
            isClientComponent = hasUseClientDirective(node);
          },
          JSXAttribute(node) {
            if (isClientComponent) return;
            if (node.name && node.name.type === "JSXIdentifier") {
              const name = node.name.name;
              if (/^on[A-Z]/.test(name)) {
                context.report({
                  node,
                  messageId: "noEventInRSC",
                  data: { name },
                  suggest: [
                    {
                      desc: "Insert 'use client' directive at top of file",
                      fix: (fixer) => {
                        const first = programNode && programNode.body && programNode.body[0];
                        if (first) {
                          return fixer.insertTextBefore(first, "'use client';\n");
                        }
                        return fixer.insertTextBeforeRange([0, 0], "'use client';\n");
                      },
                    },
                    {
                      desc: `Remove the '${name}' attribute`,
                      fix: (fixer) => fixer.remove(node),
                    },
                  ],
                });
              }
            }
          },
        };
      },
    },
    "no-server-only-in-client": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow importing 'server-only' from Client Components ('use client').",
        },
        schema: [],
        messages: {
          noServerOnlyInClient:
            "'server-only' import is not allowed in a Client Component. Remove it or move this module to the server.",
        },
      },
      create(context) {
        let isClientComponent = false;
        function hasUseClientDirective(program) {
          for (const statement of program.body) {
            if (statement.type === "EmptyStatement") continue;
            if (
              statement.type === "ExpressionStatement" &&
              statement.expression &&
              statement.expression.type === "Literal" &&
              typeof statement.expression.value === "string"
            ) {
              if (statement.expression.value === "use client") return true;
              continue;
            }
            break;
          }
          return false;
        }
        function isServerOnlySource(node) {
          return (
            node &&
            node.type === "Literal" &&
            typeof node.value === "string" &&
            node.value === "server-only"
          );
        }
        return {
          Program(node) {
            isClientComponent = hasUseClientDirective(node);
          },
          ImportDeclaration(node) {
            if (!isClientComponent) return;
            if (isServerOnlySource(node.source)) {
              context.report({ node, messageId: "noServerOnlyInClient" });
            }
          },
          ImportExpression(node) {
            if (!isClientComponent) return;
            if (isServerOnlySource(node.source)) {
              context.report({ node, messageId: "noServerOnlyInClient" });
            }
          },
        };
      },
    },
    "no-client-only-in-server": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow importing 'client-only' from Server Components (no 'use client').",
        },
        schema: [],
        messages: {
          noClientOnlyInServer:
            "'client-only' import is not allowed in a Server Component. Add 'use client' or move this code to a client module.",
        },
      },
      create(context) {
        let isClientComponent = false;
        function hasUseClientDirective(program) {
          for (const statement of program.body) {
            if (statement.type === "EmptyStatement") continue;
            if (
              statement.type === "ExpressionStatement" &&
              statement.expression &&
              statement.expression.type === "Literal" &&
              typeof statement.expression.value === "string"
            ) {
              if (statement.expression.value === "use client") return true;
              continue;
            }
            break;
          }
          return false;
        }
        function isClientOnlySource(node) {
          return (
            node &&
            node.type === "Literal" &&
            typeof node.value === "string" &&
            node.value === "client-only"
          );
        }
        return {
          Program(node) {
            isClientComponent = hasUseClientDirective(node);
          },
          ImportDeclaration(node) {
            if (isClientComponent) return;
            if (isClientOnlySource(node.source)) {
              context.report({ node, messageId: "noClientOnlyInServer" });
            }
          },
          ImportExpression(node) {
            if (isClientComponent) return;
            if (isClientOnlySource(node.source)) {
              context.report({ node, messageId: "noClientOnlyInServer" });
            }
          },
        };
      },
    },
  },
};

export default rscPlugin;


