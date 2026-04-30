import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ["better-sqlite3", "smart-whisper", "vosk", "ws"],
            },
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: "cjs",
                entryFileNames: "[name].cjs",
              },
            },
          },
        },
      },
      {
        entry: "electron/services/whisperWorker.cjs",
        vite: {
          build: {
            rollupOptions: {
              external: ["better-sqlite3", "smart-whisper", "vosk", "ws"],
              output: {
                format: "cjs",
                entryFileNames: "whisperWorker.cjs",
              },
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://api.qworship.com",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ["better-sqlite3", "smart-whisper", "vosk", "ws"],
    },
  },
});
