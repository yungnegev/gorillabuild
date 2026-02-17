import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import rscPlugin from "./scripts/eslint-rules/rsc.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**"]),
  // Unused variables — allow _ prefix to intentionally ignore
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Stylistic + RSC rules for app code
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      "@stylistic": stylistic,
      rsc: rscPlugin,
    },
    rules: {
      "@stylistic/quotes": ["error", "single", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
      "no-multiple-empty-lines": ["error", { max: 3, maxEOF: 1 }],
      "@stylistic/comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
        },
      ],
      "@stylistic/array-bracket-spacing": ["error", "always"],
      "rsc/no-jsx-events-in-server-components": "error",
      "rsc/no-server-only-in-client": "error",
      "rsc/no-client-only-in-server": "error",
    },
  },
]);

export default eslintConfig;
