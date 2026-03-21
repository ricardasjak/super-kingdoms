/**
 * Adds environment variables from .env.local to Convex.
 */

import fs from "fs";
import { execSync } from "child_process";

async function isServerUp() {
	try {
		const res = await fetch("http://127.0.0.1:3210/version");
		return res.ok;
	} catch (e) {
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
		const varsToPush = ["AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET"];

		console.log("Pushing Discord OAuth credentials from .env.local to Convex...");
		for (const line of env.split("\n")) {
			for (const v of varsToPush) {
				if (line.startsWith(`${v}=`)) {
					const val = line.substring(v.length + 1).trim();
					execSync(`npx convex env set ${v} ${val}`, { stdio: "inherit" });
				}
			}
		}
		console.log("\n✅ Successfully synced Discord secrets to the local Convex backend!");
	} catch (e) {
		console.error("Failed to push environment variables:", e.message);
	}
}

run();
