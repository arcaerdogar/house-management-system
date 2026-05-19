import { defineConfig } from "vitest/config";

/** E2E tests (manual-script flow); separate from unit/api include in root vitest.config. */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["../setup.ts"],
    include: ["**/*.test.ts"],
    root: import.meta.dirname,
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
