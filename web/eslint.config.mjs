import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default [
  {
    name: "global-file-settings",
    files: ["**/*.{ts,tsx}"],
  },
  {
    name: "global-ignore-settings",
    ignores: ["src/styled-system", "public", "out", ".next", "node_modules"],
  },
  {
    settings: {
      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    name: "eslint-recommended",
    ...eslint.configs.recommended,
  },
  {
    name: "eslint-sort-imports",
    plugins: {
      eslint: eslint,
    },
    rules: {
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
    },
  },
  ...tseslint.config(tseslint.configs.strict, tseslint.configs.stylistic, {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "_*",
        },
      ],
    },
  }),
  {
    name: "prettier",
    ...eslintConfigPrettier,
  },
  {
    name: "next/core-web-vitals",
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    name: "react",
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    name: "sort-imports",
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [
            {
              pattern: "{react,react-dom/**,next/**}",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "@/styled-system/**",
              group: "external",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
    },
  },
];
