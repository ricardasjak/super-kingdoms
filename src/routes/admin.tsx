import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin")({
	component: AdminPage,
});

function AdminPage() {
	const gameStatus = useQuery(api.game.getGameStatus);
	const advanceTick = useMutation(api.game.advanceTick);
	const [executionTime, setExecutionTime] = useState<number | null>(null);

	const handleAdvanceTick = async () => {
		try {
			const result = await advanceTick();
			console.log("Mutation Result:", result);
			if (result?.executionTimeMs) {
				setExecutionTime(result.executionTimeMs);
			}
		} catch (error) {
			console.error("Failed to advance tick", error);
			alert(error instanceof Error ? error.message : "Failed to advance tick");
		}
	};

	return (
		<main className="container" style={{ marginTop: "2rem" }}>
			<article>
				<header>
					<h2>Admin Dashboard</h2>
				</header>
				<div className="grid">
					<div>
						<h3>Game Status</h3>
						{gameStatus === undefined ? (
							<p aria-busy="true">Loading...</p>
						) : (
							<div>
								<p>
									Current Tick: <strong>{gameStatus.currentTick}</strong> /{" "}
									{gameStatus.endTick}
								</p>
								{executionTime !== null && (
									<p
										style={{
											marginTop: "0.5rem",
											fontSize: "0.9rem",
											color: "var(--pico-muted-color)",
										}}
									>
										Last execution time: {executionTime.toFixed(2)} ms
									</p>
								)}
							</div>
						)}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
						}}
					>
						<button
							type="button"
							onClick={handleAdvanceTick}
							disabled={
								!gameStatus || gameStatus.currentTick >= gameStatus.endTick
							}
							style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<title>Play Next Tick</title>
								<polygon points="5 3 19 12 5 21 5 3"></polygon>
							</svg>
							Play Next Tick
						</button>
					</div>
				</div>
			</article>
		</main>
	);
}
