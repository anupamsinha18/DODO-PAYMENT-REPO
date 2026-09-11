import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/DODO-PAYMENT-REPO/checkout/" : "/",
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});
