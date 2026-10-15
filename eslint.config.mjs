import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      "**/*.md",
      "**/*.mdx",
      ".next/**",
      ".next-dev/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      ".lighthouseci/**",
      ".motion-baseline/**",
      ".performance-results/**",
      ".vercel/**",
      "playwright-report/**",
      "test-results/**",
      "jest.config.js",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Next 16 enables additional React Compiler rules for existing code.
      // Keep the prior lint gate while these patterns are migrated separately.
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
