import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "@components": path.resolve(__dirname, "./src/components/"),
      "@public": path.resolve(__dirname, "./public/"),
    },
  },
server: {
  host: true,
  port: 5173,
    allowedHosts: ['wellbot.centralindia.cloudapp.azure.com'], // ✅ explicitly allowed
}

});
