import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Requires `vercel dev` running on :3000 alongside `npm run dev`,
      // so /api/* behaves the same locally as it does on Vercel.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
