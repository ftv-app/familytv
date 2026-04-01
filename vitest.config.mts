import "@testing-library/jest-dom/vitest";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["src/test/**/*.spec.{ts,tsx}", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      thresholds: {
        statements: 97,
        branches: 97,
        functions: 97,
        lines: 97,
      },
      include: [
        "src/lib/socket/types.ts",
        "src/lib/socket/validation.ts",
        "src/lib/socket/rooms.ts",
      ],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "e2e/**",
        "**/*.sql",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
