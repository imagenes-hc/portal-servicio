import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://imagenes-hc.github.io",
  base: "/portal-servicio",
  vite: {
    plugins: [tailwindcss()],
  },
});
