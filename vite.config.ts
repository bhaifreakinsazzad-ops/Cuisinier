import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: { port: 3000 },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("@supabase/supabase-js")) {
            return "supabase";
          }

          if (id.includes("react-router")) {
            return "router";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (id.includes("react")) {
            return "react-vendor";
          }
        },
      },
    },
  },
});
