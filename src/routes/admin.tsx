import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { PlayButton } from "../components/play-button";
export const Route = createFileRoute("/admin")({
	component: AdminPage,
});

function AdminPage() {
	const gameStatus = useQuery(api.game.getGameStatus);
	const kingdomsCount = useQuery(api.kingdoms.getKingdomsCount);
	const restartGame = useAction(api.game.restartGame);
	const populateKingdoms = useMutation(api.kingdoms.populateKingdoms);
	const migrateKingdoms = useAction(api.kingdoms.migrateKingdoms);
	const [executionTime, setExecutionTime] = useState<number | null>(null);
	const [isPopulating, setIsPopulating] = useState(false);
	const [isMigrating, setIsMigrating] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const clearMessages = () => {
		setErrorMsg(null);
		setSuccessMsg(null);
	};

	const handleRestartGame = async () => {
		clearMessages();
		if (
			window.confirm(
				"Are you sure you want to COMPLETELY WIPE the whole game data? This cannot be undone!",
			)
		) {
			try {
				await restartGame();
				setExecutionTime(null);
				setSuccessMsg("The game has been successfully restarted.");
			} catch (error) {
				console.error("Failed to restart the game", error);
				setErrorMsg(
					error instanceof Error ? error.message : "Failed to restart the game",
				);
			}
		}
	};

	const handlePopulate = async () => {
		clearMessages();
		setIsPopulating(true);
		try {
			await populateKingdoms();
			setSuccessMsg("Successfully populated 1000 dummy kingdoms!");
		} catch (error) {
			console.error("Failed to populate kingdoms", error);
			setErrorMsg(
				error instanceof Error ? error.message : "Failed to populate kingdoms",
			);
		} finally {
			setIsPopulating(false);
		}
	};

	const handleMigrate = async () => {
		clearMessages();
		setIsMigrating(true);
		try {
			const result = await migrateKingdoms();
			setSuccessMsg(`Successfully migrated ${result.count} kingdoms!`);
		} catch (error) {
			console.error("Failed to migrate kingdoms", error);
			setErrorMsg(
				error instanceof Error ? error.message : "Failed to migrate kingdoms",
			);
		} finally {
			setIsMigrating(false);
		}
	};

	return (
		<main className="container" style={{ marginTop: "2rem" }}>
			<article>
				<header>
					<h2>Admin Dashboard</h2>
				</header>

				{errorMsg && (
					<div style={{ marginBottom: "1rem" }}>
						<article
							style={{
								margin: 0,
								backgroundColor: "var(--pico-del-color)",
								color: "var(--pico-primary-inverse)",
							}}
						>
							<strong>Error:</strong> {errorMsg}
						</article>
					</div>
				)}

				{successMsg && (
					<div style={{ marginBottom: "1rem" }}>
						<article
							style={{
								margin: 0,
								backgroundColor: "var(--pico-ins-color)",
								color: "var(--pico-primary-inverse)",
							}}
						>
							<strong>Success:</strong> {successMsg}
						</article>
					</div>
				)}

				<div className="grid">
					<div>
						<h3>Game Status</h3>
						{gameStatus === undefined ? (
							<p aria-busy="true">Loading...</p>
						) : (
							<div>
								<p>
									Round: <strong>{gameStatus.roundNumber ?? 1}</strong>
								</p>
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
						{kingdomsCount !== undefined && (
							<p style={{ marginTop: "1rem" }}>
								Total Kingdoms:{" "}
								<strong>{kingdomsCount.toLocaleString()}</strong>
							</p>
						)}
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							justifyContent: "center",
							gap: "1rem",
						}}
					>
						<PlayButton 
							onExecutionTime={setExecutionTime} 
							onError={setErrorMsg}
							onSuccess={() => { clearMessages(); }}
						/>

						<button
							type="button"
							className="secondary"
							onClick={handleRestartGame}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								backgroundColor: "var(--pico-del-color)",
								borderColor: "var(--pico-del-color)",
								color: "var(--pico-primary-inverse)",
							}}
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
								<title>Restart Game</title>
								<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
								<path d="M3 3v5h5"></path>
							</svg>
							Restart Game
						</button>

						<button
							type="button"
							className="secondary outline"
							onClick={handleMigrate}
							disabled={isMigrating}
							aria-busy={isMigrating}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								borderColor: "var(--pico-ins-color)",
								color: "var(--pico-ins-color)",
							}}
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
								<title>Migrate Data</title>
								<path d="M12 2v20"></path>
								<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
							</svg>
							Migrate Missing Fields
						</button>

						<button
							type="button"
							className="secondary outline"
							onClick={handlePopulate}
							disabled={isPopulating}
							aria-busy={isPopulating}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
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
								<title>Populate Kingdoms</title>
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
								<circle cx="9" cy="7" r="4"></circle>
								<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
								<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
							</svg>
							Populate Kingdoms (x1000)
						</button>
					</div>
				</div>
			</article>
		</main>
	);
}
