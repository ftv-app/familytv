import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/test/**/*.test.{ts,tsx}",
      "src/components/**/*.test.{ts,tsx}",
      "src/lib/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "src/test/**/*.spec.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      thresholds: {
        statements: 97,
        branches: 97,
        functions: 97,
        lines: 97,
      },
      // FamilyTV-specific components and utilities for coverage tracking
      include: [
        "src/lib/utils.ts",
        "src/lib/watch-party/presence.ts",
        "src/app/api/posts/route.ts",
        "src/app/api/comments/route.ts",
        "src/app/api/reactions/route.ts",
        "src/app/api/family/route.ts",
        "src/app/api/invite/route.ts",
        "src/app/api/events/route.ts",
        "src/components/progress-dots.tsx",
        "src/components/theme-toggle.tsx",
        "src/components/error-boundary.tsx",
        "src/components/notifications-client.tsx",
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
