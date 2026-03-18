import { existsSync, readFileSync } from "node:fs";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const certExists = existsSync("./dev.crt") && existsSync("./dev.key");

const https = certExists
	? {
			key: readFileSync("./dev.key"),
			cert: readFileSync("./dev.crt"),
		}
	: undefined;

// https://vite.dev/config/
export default defineConfig({
	plugins: [TanStackRouterVite(), react()],
	server: {
		https,
		port: 5173,
		proxy: {
			"/api/auth": {
				target: "http://127.0.0.1:3211",
				changeOrigin: true,
			},
			"/api": {
				target: "http://127.0.0.1:3210",
				changeOrigin: true,
				ws: true,
			},
		},
	},
});
