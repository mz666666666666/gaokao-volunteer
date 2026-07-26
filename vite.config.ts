import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api/gugudata": {
        target: "https://api.gugudata.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gugudata/, ""),
      },
    },
  },
});
