import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Allow explicit-any in test files (testing-library patterns require any for mock types)
  {
    files: ["src/test/**", "src/__tests__/**", "src/components/**/*.test.tsx", "src/lib/**/*.test.ts", "src/lib/**/*.test.tsx", "e2e/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone DB scripts use CommonJS require
    "add_tables.js",
    "check_tables.js",
    "create_tables.js",
    "coverage/**",
  ]),
]);

export default eslintConfig;
