import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/blast-game/",

	resolve: {
		alias: {
			src: resolve(__dirname, "src"),
		},
	},
});
