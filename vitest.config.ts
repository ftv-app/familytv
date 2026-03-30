import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.{ts,tsx}"],
    exclude: ["src/test/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      include: [
        "src/lib/utils.ts",
        "src/app/api/posts/route.ts",
        "src/app/api/comments/route.ts",
        "src/app/api/reactions/route.ts",
        "src/app/api/family/route.ts",
        "src/app/api/invite/route.ts",
        "src/app/api/events/route.ts",
      ],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "e2e/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
