import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("test"),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      thresholds: {
        // TODO(Familytv): Raise to 90% in Sprint 004 — currently 18%
        // Focusing on getting tests written and passing first
        statements: 15,
        branches: 15,
        functions: 8,
        lines: 15,
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
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
