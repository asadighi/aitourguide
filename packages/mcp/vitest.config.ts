import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@aitourguide/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  test: {
    globals: false,
  },
});

