import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../constants/game-params";

export const Route = createFileRoute("/kingdom/explore")({
	component: KingdomExplore,
});

function KingdomExplore() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const toggleAutoExplore = useMutation(api.kingdoms.toggleAutoExplore);

	if (myKingdom === undefined) return <p aria-busy="true">Loading...</p>;
	if (!myKingdom) return <p>Kingdom not found.</p>;

	const currentlyInQueue = myKingdom.landQueue.reduce((a, b) => a + b, 0);
	const currentLevel = Number(myKingdom.autoExplore || 0);
	const limitPct = currentLevel * 0.02;
	const maxPossibleExplore = Math.floor(myKingdom.land * limitPct);

	const baseCost = GAME_PARAMS.explore.cost(myKingdom.land);
	let landMultiplier = 1;
	let discountLabel = "";
	if (myKingdom.land < 1000) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
		discountLabel = `New Kingdom Discount (${Math.round((1 - landMultiplier) * 100)}%)`;
	} else if (myKingdom.land < 2500) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
		discountLabel = `Developing Kingdom Discount (${Math.round((1 - landMultiplier) * 100)}%)`;
	} else if (myKingdom.land < 5000) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];
		discountLabel = `Established Kingdom Discount (${Math.round((1 - landMultiplier) * 100)}%)`;
	}

	const levelMultiplier =
		currentLevel > 0
			? GAME_PARAMS.explore.levelMultipliers[currentLevel - 1]
			: 1;
	const costPerLand = Math.round(baseCost * levelMultiplier * landMultiplier);

	const handleLevelChange = async (newLevel: number) => {
		try {
			await toggleAutoExplore({ autoExplore: newLevel });
		} catch (error) {
			console.error("Failed to update auto explore level", error);
			alert(error instanceof Error ? error.message : "Update failed");
		}
	};

	const levels = [
		{ val: 0, label: "0% (Disabled)" },
		{ val: 1, label: "2%" },
		{ val: 2, label: "4%" },
		{ val: 3, label: "6%" },
		{ val: 4, label: "8%" },
		{ val: 5, label: "10% (Max)" },
	];

	return (
		<main className="container">
			<article>
				<header>
					<h2>Explore Land</h2>
					<p>
						Expeditions are now managed automatically based on your desired
						expansion level.
					</p>
				</header>
				<div className="grid">
					<div>
						<h3>Exploration Strategy</h3>
						<label htmlFor="autoExploreRange">
							Exploration Level:{" "}
							<strong>
								{levels.find((l) => l.val === currentLevel)?.label}
							</strong>
							<input
								type="range"
								id="autoExploreRange"
								name="autoExploreRange"
								min="0"
								max="5"
								step="1"
								value={currentLevel}
								onChange={(e) =>
									handleLevelChange(Number.parseInt(e.target.value, 10))
								}
								style={{ marginBottom: "1rem" }}
							/>
						</label>

						<div
							className="grid"
							style={{
								fontSize: "0.85rem",
								textAlign: "center",
								color: "var(--pico-muted-color)",
							}}
						>
							{levels.map((l) => (
								<button
									key={l.val}
									type="button"
									className={currentLevel === l.val ? "" : "outline"}
									style={{
										padding: "0.25rem 0.5rem",
										fontSize: "0.85rem",
										marginBottom: 0,
									}}
									onClick={() => handleLevelChange(l.val)}
								>
									{l.val}
								</button>
							))}
						</div>

						<p style={{ marginTop: "1.5rem" }}>
							<small>
								Exploration will trigger automatically every tick if:
								<ul style={{ marginTop: "0.5rem" }}>
									<li>
										Your current land + queue is below{" "}
										<strong>{currentLevel * 2}%</strong> of your current land.
									</li>
									<li>You have enough money in the treasury.</li>
								</ul>
								Expeditions are queued in chunks of 24 land pieces.
							</small>
						</p>
					</div>
					<div>
						<article
							style={{
								backgroundColor: "var(--pico-card-sectioning-background-color)",
							}}
						>
							<h4>Kingdom Status</h4>
							<ul>
								<li>Current Land: {myKingdom.land.toLocaleString()}</li>
								<li>
									Current Limit: {maxPossibleExplore.toLocaleString()} land (
									{currentLevel * 2}%)
								</li>
								<li>
									Actively Exploring:{" "}
									<span
										data-tooltip={
											myKingdom.landQueue.length > 0
												? myKingdom.landQueue.join(", ")
												: "No active expeditions"
										}
										style={{ cursor: "help", borderBottom: "1px dashed" }}
									>
										{currentlyInQueue.toLocaleString()} land
									</span>
								</li>
							</ul>
							<hr />
							<ul>
								<li>Cost: ${costPerLand.toLocaleString()} per piece of land</li>
								{discountLabel && (
									<li
										style={{
											color: "var(--pico-primary)",
											fontSize: "0.85rem",
											fontWeight: "bold",
										}}
									>
										{discountLabel}
									</li>
								)}
								<li>Completion Time: {GAME_PARAMS.explore.duration} ticks</li>
								<li>Treasury: ${myKingdom.money.toLocaleString()}</li>
							</ul>
						</article>
					</div>
				</div>
			</article>
		</main>
	);
}
