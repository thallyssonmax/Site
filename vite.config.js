import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        adminer: fileURLToPath(new URL("./projects/adminer/index.html", import.meta.url)),
      },
    },
  },
});
