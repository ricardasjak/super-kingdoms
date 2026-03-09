import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../constants/kingdom";

export const Route = createFileRoute("/kingdom/explore")({
	component: KingdomExplore,
});

function KingdomExplore() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const exploreLand = useMutation(api.kingdoms.exploreLand);
	const [amount, setAmount] = useState<number>(0);
	const [isExploring, setIsExploring] = useState(false);

	if (myKingdom === undefined) return <p aria-busy="true">Loading...</p>;
	if (!myKingdom) return <p>Kingdom not found.</p>;

	const currentlyInQueue = myKingdom.landQueue.reduce((a, b) => a + b, 0);
	const maxPossibleExplore = Math.floor(myKingdom.land * 0.1);
	const maxExplore = Math.max(0, maxPossibleExplore - currentlyInQueue);

	const costPerLand = GAME_PARAMS.explorationCost(myKingdom.land);
	const totalCost = costPerLand * amount;
	const isOverLimit = amount > maxExplore;
	const isBroke = myKingdom.money < totalCost;
	const canExplore = amount > 0 && !isOverLimit && !isBroke && !isExploring;

	const handleExplore = async () => {
		if (!canExplore) return;
		setIsExploring(true);
		try {
			await exploreLand({ amount });
			setAmount(0);
			alert(`Successfully queued exploration for ${amount} land.`);
		} catch (error) {
			console.error("Failed to explore land", error);
			alert(error instanceof Error ? error.message : "Exploration failed");
		} finally {
			setIsExploring(false);
		}
	};

	return (
		<main className="container">
			<article>
				<header>
					<h2>Explore Land</h2>
					<p>Send expeditions to discover new land for your kingdom.</p>
				</header>
				<div className="grid">
					<div>
						<h3>Exploration Desk</h3>
						<label htmlFor="exploreAmount">
							Amount of land to explore (Max {maxExplore})
							<input
								type="number"
								id="exploreAmount"
								name="exploreAmount"
								min="0"
								max={maxExplore}
								value={amount || ""}
								onChange={(e) =>
									setAmount(Number.parseInt(e.target.value) || 0)
								}
							/>
						</label>
						<p>
							<small>
								Cost: ${costPerLand.toLocaleString()} per piece of land.
							</small>
						</p>
					</div>
					<div>
						<article
							style={{
								backgroundColor: "var(--pico-card-sectioning-background-color)",
							}}
						>
							<h4>Overview</h4>
							<ul>
								<li>Current Land: {myKingdom.land.toLocaleString()}</li>
								<li>Treasury: ${myKingdom.money.toLocaleString()}</li>
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
								<li>Requested Explorations: {amount.toLocaleString()}</li>
								<li
									style={{
										color: isBroke ? "var(--pico-del-color)" : "inherit",
									}}
								>
									Total Cost Estimate: ${totalCost.toLocaleString()}
								</li>
								<li>
									Completion Time: {GAME_PARAMS.explorationDuration} ticks
								</li>
							</ul>
							<button
								type="button"
								onClick={handleExplore}
								disabled={!canExplore}
								aria-busy={isExploring}
							>
								{isOverLimit
									? "Over Limit!"
									: isBroke
										? "Not Enough Money"
										: "Queue Expedition"}
							</button>
						</article>
					</div>
				</div>
			</article>
		</main>
	);
}
