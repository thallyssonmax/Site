import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        analytics: fileURLToPath(new URL("./analytics/index.html", import.meta.url)),
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        adminer: fileURLToPath(new URL("./projects/adminer/index.html", import.meta.url)),
        brains: fileURLToPath(new URL("./projects/brains/index.html", import.meta.url)),
      },
    },
  },
});
