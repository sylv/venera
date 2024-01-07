import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  treeshake: true,
  splitting: true,
  clean: true,
  dts: true,
  format: "esm",
  define: {
    "import.meta.vitest": "undefined",
  },
});
