import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:3000";

const apiProxy = {
  target: apiTarget,
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/auth": apiProxy,
      "/me": apiProxy,
      "/houses": apiProxy,
      "/absences": apiProxy,
      "/files": apiProxy,
    },
  },
});
