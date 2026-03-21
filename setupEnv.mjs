/**
 * Adds environment variables from .env.local to Convex.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";

async function isServerUp() {
	try {
		const res = await fetch("http://127.0.0.1:3210/version");
		return res.ok;
	} catch (_e) {
		return false;
	}
}

async function run() {
	console.log("Waiting for local Convex backend to start...");
	for (let i = 0; i < 30; i++) {
		if (await isServerUp()) {
			break;
		}
		await new Promise((r) => setTimeout(r, 1000));
	}

	try {
		const env = fs.readFileSync(".env.local", "utf8");
		const varsToPush = ["AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET", "SITE_URL"];

		console.log(
			"Pushing Discord OAuth credentials from .env.local to Convex...",
		);
		for (const line of env.split("\n")) {
			for (const v of varsToPush) {
				if (line.startsWith(`${v}=`)) {
					const val = line.substring(v.length + 1).trim();
					execSync(`npx convex env set ${v} ${val}`, { stdio: "inherit" });
				}
			}
		}
		console.log(
			"\n✅ Successfully synced Discord secrets to the local Convex backend!",
		);

		// Check for Convex Auth keys
		console.log("\nChecking if Convex Auth keys exist...");
		const { spawnSync } = await import("node:child_process");
		const check = spawnSync(
			"npx",
			["convex", "env", "get", "JWT_PRIVATE_KEY"],
			{ encoding: "utf8" },
		);

		if (check.stderr?.includes("not found")) {
			console.log(
				"Missing JWT_PRIVATE_KEY. Auto-initializing Convex Auth keys...",
			);
			spawnSync(
				"npx",
				["@convex-dev/auth", "--web-server-url", "http://localhost:5173"],
				{
					input: "\n".repeat(10), // Automatically pass "enter" to defaults (No to overwrite, Yes to generate new)
					stdio: ["pipe", "inherit", "inherit"],
				},
			);
			console.log("✅ Successfully auto-generated new local Auth keys!");
		} else {
			console.log(
				"✅ Convex Auth keys already securely configured, skipping generation.",
			);
		}
	} catch (e) {
		console.error("Failed to push environment variables:", e.message);
	}
}

run();
