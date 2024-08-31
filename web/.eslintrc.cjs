/** @type {import('eslint').Linter.Config} */
module.exports = {
  parserOptions: {
    project: true,
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: ["next/core-web-vitals", "prettier"],
  ignorePatterns: ["node_modules", ".next", "public", "out"],
  rules: {
    // Import sorting.
    // https://eslint.org/docs/rules/sort-imports
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md
    "sort-imports": [
      "error",
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],
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
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@typescript-eslint/strict",
        "plugin:@typescript-eslint/stylistic",
        "plugin:import/recommended",
        "plugin:import/typescript",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "_", // _だけの引数はno-unused-varsを無視
          },
        ],
        "@typescript-eslint/no-shadow": "off",
        // https://typescript-eslint.io/rules/consistent-type-imports
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
      },
    },
  ],
};
