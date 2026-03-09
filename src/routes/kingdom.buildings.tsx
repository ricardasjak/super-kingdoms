import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../constants/game-params";
import { calculateFreeLand } from "../utils/buildingUtils";

export const Route = createFileRoute("/kingdom/buildings")({
	component: KingdomBuildingsPage,
});

function QueueTooltip({
	count,
	queueArray,
}: {
	count: number;
	queueArray: number[];
}) {
	if (count <= 0 || !queueArray) return <span>-</span>;

	// Create a comma-separated list of the array values
	const queueString = queueArray.join(" ");

	return (
		<span
			data-tooltip={`Construction queue: ${queueString}`}
			style={{ cursor: "help" }}
		>
			+{count}
		</span>
	);
}

function KingdomBuildingsPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const buildings = useQuery(api.kingdoms.getKingdomBuildings);
	const buildBuildings = useMutation(api.kingdoms.buildBuildings);

	const [buildQueue, setBuildQueue] = useState({
		res: "",
		sm: "",
		plants: "",
		rax: "",
		pf: "",
		tc: "",
		asb: "",
		ach: "",
	});
	const [isBuilding, setIsBuilding] = useState(false);

	if (myKingdom === undefined || buildings === undefined) {
		return (
			<main className="container">
				<article aria-busy="true">Loading kingdom buildings...</article>
			</main>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/kingdom/create" });
		return null;
	}

	if (buildings === null) {
		return (
			<main className="container">
				<article>
					<header>Error</header>
					<p>Could not locate buildings data for your kingdom.</p>
				</article>
			</main>
		);
	}

	const freeLand = calculateFreeLand(
		myKingdom.land,
		buildings,
		buildings.queue,
	);

	const queuedCounts: Record<string, number> = {
		res: 0,
		plants: 0,
		rax: 0,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
	};
	if (buildings.queue) {
		const keys = [
			"res",
			"plants",
			"rax",
			"sm",
			"pf",
			"tc",
			"asb",
			"ach",
		] as const;
		for (const key of keys) {
			if (buildings.queue[key]) {
				queuedCounts[key] = buildings.queue[key].reduce(
					(sum: number, val: number) => sum + val,
					0,
				);
			}
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setBuildQueue((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const requestSum = Object.values(buildQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const buildingCost = GAME_PARAMS.buildingCost(myKingdom.land);
	const totalCost = requestSum * buildingCost;

	const handleBuild = async (e: React.FormEvent) => {
		e.preventDefault();
		if (requestSum > freeLand) {
			alert("Not enough free land!");
			return;
		}
		if (requestSum <= 0) {
			alert("Please enter a valid amount of buildings to construct.");
			return;
		}
		if (myKingdom.money < totalCost) {
			alert("Not enough money!");
			return;
		}

		setIsBuilding(true);
		try {
			await buildBuildings({
				res: parseInt(buildQueue.res, 10) || 0,
				plants: parseInt(buildQueue.plants, 10) || 0,
				rax: parseInt(buildQueue.rax, 10) || 0,
				sm: parseInt(buildQueue.sm, 10) || 0,
				pf: parseInt(buildQueue.pf, 10) || 0,
				tc: parseInt(buildQueue.tc, 10) || 0,
				asb: parseInt(buildQueue.asb, 10) || 0,
				ach: parseInt(buildQueue.ach, 10) || 0,
			});
			setBuildQueue({
				res: "",
				sm: "",
				plants: "",
				rax: "",
				pf: "",
				tc: "",
				asb: "",
				ach: "",
			});
		} catch (error) {
			console.error(error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to build";
			alert(errorMessage);
		} finally {
			setIsBuilding(false);
		}
	};

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Buildings</h2>
						<p>Current structures and facilities</p>
					</hgroup>
				</header>

				<form onSubmit={handleBuild}>
					<figure>
						<table className="striped">
							<thead>
								<tr>
									<th scope="col">Building Type</th>
									<th scope="col">Count</th>
									<th scope="col">In Queue</th>
									<th scope="col">Build</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Residences</td>
									<td>{buildings.res}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.res}
											queueArray={buildings.queue?.res || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="res"
											value={buildQueue.res}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Star Mines</td>
									<td>{buildings.sm}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.sm}
											queueArray={buildings.queue?.sm || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="sm"
											value={buildQueue.sm}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Power Plants</td>
									<td>{buildings.plants}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.plants}
											queueArray={buildings.queue?.plants || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="plants"
											value={buildQueue.plants}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Barracks</td>
									<td>{buildings.rax}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.rax}
											queueArray={buildings.queue?.rax || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="rax"
											value={buildQueue.rax}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Probe Factories</td>
									<td>{buildings.pf}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.pf}
											queueArray={buildings.queue?.pf || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="pf"
											value={buildQueue.pf}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Training Camps</td>
									<td>{buildings.tc}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.tc}
											queueArray={buildings.queue?.tc || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="tc"
											value={buildQueue.tc}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Air Support Bays</td>
									<td>{buildings.asb}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.asb}
											queueArray={buildings.queue?.asb || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="asb"
											value={buildQueue.asb}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Aegis Control Hubs</td>
									<td>{buildings.ach}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.ach}
											queueArray={buildings.queue?.ach || []}
										/>
									</td>
									<td>
										<input
											type="number"
											name="ach"
											value={buildQueue.ach}
											onChange={handleInputChange}
											min="0"
											disabled={isBuilding}
										/>
									</td>
								</tr>
								<tr>
									<td>Rubble</td>
									<td>{buildings.rubble}</td>
									<td>-</td>
									<td>-</td>
								</tr>
							</tbody>
						</table>
					</figure>

					<footer>
						<div className="grid">
							<div>
								<p>
									<strong>Free Land:</strong> {freeLand}
								</p>
								<p>
									<strong>Requested:</strong> {requestSum}
								</p>
							</div>
							<div>
								<p>
									<strong>Available Money:</strong>{" "}
									{myKingdom.money.toLocaleString()}
								</p>
								<p>
									<strong>Total Cost:</strong> {totalCost.toLocaleString()}{" "}
									<small className="text-muted">
										({buildingCost.toLocaleString()} per building)
									</small>
								</p>
							</div>
							<div style={{ textAlign: "right" }}>
								<button
									type="submit"
									disabled={
										isBuilding ||
										requestSum > freeLand ||
										requestSum <= 0 ||
										myKingdom.money < totalCost
									}
								>
									{isBuilding ? "Building..." : "Build"}
								</button>
							</div>
						</div>
					</footer>
				</form>
			</article>
		</main>
	);
}
