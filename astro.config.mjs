import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import react from '@astrojs/react';

export default defineConfig({
  integrations: [clerk(), react() ],
  adapter: node({ mode: "standalone" }),
  output: "server",
});