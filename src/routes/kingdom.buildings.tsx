import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../constants/game-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";
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
	const buildings = myKingdom?.buildings;
	const buildBuildings = useMutation(api.kingdoms.buildBuildings);
	const saveAutoBuildSettings = useMutation(api.kingdoms.saveAutoBuildSettings);

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
	const [targetQueue, setTargetQueue] = useState({
		res: "",
		plants: "",
		rax: "",
		sm: "",
		pf: "",
		tc: "",
		asb: "",
		ach: "",
	});
	const [targetInitialized, setTargetInitialized] = useState(false);
	const [isBuilding, setIsBuilding] = useState(false);
	const { showMessage } = useKingdomMessage();

	useEffect(() => {
		if (buildings && !targetInitialized) {
			if (buildings.target) {
				setTargetQueue({
					res: buildings.target.res.toString(),
					plants: buildings.target.plants.toString(),
					rax: buildings.target.rax.toString(),
					sm: buildings.target.sm.toString(),
					pf: buildings.target.pf.toString(),
					tc: buildings.target.tc.toString(),
					asb: buildings.target.asb.toString(),
					ach: buildings.target.ach.toString(),
				});
			} else {
				const total =
					buildings.res +
					buildings.plants +
					buildings.rax +
					buildings.sm +
					buildings.pf +
					buildings.tc +
					buildings.asb +
					buildings.ach;

				if (total > 0) {
					setTargetQueue({
						res: Math.round((buildings.res / myKingdom.land) * 100).toString(),
						plants: Math.round(
							(buildings.plants / myKingdom.land) * 100,
						).toString(),
						rax: Math.round((buildings.rax / myKingdom.land) * 100).toString(),
						sm: Math.round((buildings.sm / myKingdom.land) * 100).toString(),
						pf: Math.round((buildings.pf / myKingdom.land) * 100).toString(),
						tc: Math.round((buildings.tc / myKingdom.land) * 100).toString(),
						asb: Math.round((buildings.asb / myKingdom.land) * 100).toString(),
						ach: Math.round((buildings.ach / myKingdom.land) * 100).toString(),
					});
				} else {
					setTargetQueue({
						res: "0",
						plants: "0",
						rax: "0",
						sm: "0",
						pf: "0",
						tc: "0",
						asb: "0",
						ach: "0",
					});
				}
			}
			setTargetInitialized(true);
		}
	}, [buildings, targetInitialized, myKingdom.land]);

	if (myKingdom === undefined) {
		return (
			<main className="container">
				<article aria-busy="true">Loading kingdom...</article>
			</main>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/kingdom/create" });
		return null;
	}

	if (!buildings) {
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

	const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setTargetQueue((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const targetSum = Object.values(targetQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const requestSum = Object.values(buildQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const buildingCost = GAME_PARAMS.buildings.cost(myKingdom.land);
	const totalCost = requestSum * buildingCost;

	const actualPercent = (count: number) => {
		if (!myKingdom.land) return "0.0%";
		return `${((count / myKingdom.land) * 100).toFixed(1)}%`;
	};

	const handleBuild = async (e: React.FormEvent) => {
		e.preventDefault();

		if (requestSum > freeLand) {
			showMessage("Not enough free land!", "error");
			return;
		}
		if (requestSum <= 0) {
			showMessage(
				"Please enter a valid amount of buildings to construct.",
				"error",
			);
			return;
		}
		if (myKingdom.money < totalCost) {
			showMessage("Not enough money!", "error");
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
			showMessage("Buildings successfully queued for construction!", "success");
		} catch (error) {
			console.error(error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to build";
			showMessage(errorMessage, "error");
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
									<th scope="col">Actual %</th>
									<th scope="col">Count</th>
									<th scope="col">In Queue</th>
									{myKingdom.autoBuild && <th scope="col">Target %</th>}
									<th scope="col">Build</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Residences</td>
									<td>{actualPercent(buildings.res)}</td>
									<td>{buildings.res}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.res}
											queueArray={buildings.queue?.res || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="res"
												value={targetQueue.res}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.sm)}</td>
									<td>{buildings.sm}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.sm}
											queueArray={buildings.queue?.sm || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="sm"
												value={targetQueue.sm}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.plants)}</td>
									<td>{buildings.plants}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.plants}
											queueArray={buildings.queue?.plants || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="plants"
												value={targetQueue.plants}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.rax)}</td>
									<td>{buildings.rax}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.rax}
											queueArray={buildings.queue?.rax || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="rax"
												value={targetQueue.rax}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.pf)}</td>
									<td>{buildings.pf}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.pf}
											queueArray={buildings.queue?.pf || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="pf"
												value={targetQueue.pf}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.tc)}</td>
									<td>{buildings.tc}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.tc}
											queueArray={buildings.queue?.tc || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="tc"
												value={targetQueue.tc}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.asb)}</td>
									<td>{buildings.asb}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.asb}
											queueArray={buildings.queue?.asb || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="asb"
												value={targetQueue.asb}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.ach)}</td>
									<td>{buildings.ach}</td>
									<td>
										<QueueTooltip
											count={queuedCounts.ach}
											queueArray={buildings.queue?.ach || []}
										/>
									</td>
									{myKingdom.autoBuild && (
										<td>
											<input
												type="number"
												name="ach"
												value={targetQueue.ach}
												onChange={handleTargetChange}
												min="0"
												max="100"
											/>
										</td>
									)}
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
									<td>{actualPercent(buildings.rubble)}</td>
									<td>{buildings.rubble}</td>
									<td>-</td>
									{myKingdom.autoBuild && <td>-</td>}
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

			<article>
				<header>Auto Build</header>

				<label htmlFor="autoBuild">
					<input
						type="checkbox"
						role="switch"
						id="autoBuild"
						name="autoBuild"
						aria-checked={myKingdom.autoBuild ?? false}
						checked={myKingdom.autoBuild ?? false}
						onChange={async (e) => {
							const isChecked = e.target.checked;
							try {
								await saveAutoBuildSettings({
									autoBuild: isChecked,
									target: {
										res: parseInt(targetQueue.res, 10) || 0,
										plants: parseInt(targetQueue.plants, 10) || 0,
										rax: parseInt(targetQueue.rax, 10) || 0,
										sm: parseInt(targetQueue.sm, 10) || 0,
										pf: parseInt(targetQueue.pf, 10) || 0,
										tc: parseInt(targetQueue.tc, 10) || 0,
										asb: parseInt(targetQueue.asb, 10) || 0,
										ach: parseInt(targetQueue.ach, 10) || 0,
									},
								});
								showMessage(
									isChecked ? "Auto-Build enabled!" : "Auto-Build disabled!",
									isChecked ? "success" : "warning",
								);
							} catch (error) {
								showMessage(
									error instanceof Error ? error.message : "Toggle failed",
									"error",
								);
							}
						}}
					/>
					Enable Auto-Build
				</label>

				{myKingdom.autoBuild && (
					<div style={{ marginTop: "1rem" }}>
						<p>
							Target Sum:{" "}
							<strong
								style={{
									color: targetSum > 100 ? "var(--pico-del-color)" : "inherit",
								}}
							>
								{targetSum}%
							</strong>{" "}
							(Target percentages must sum to &le; 100%)
						</p>
						<button
							type="button"
							onClick={async () => {
								try {
									await saveAutoBuildSettings({
										autoBuild: myKingdom.autoBuild ?? false,
										target: {
											res: parseInt(targetQueue.res, 10) || 0,
											plants: parseInt(targetQueue.plants, 10) || 0,
											rax: parseInt(targetQueue.rax, 10) || 0,
											sm: parseInt(targetQueue.sm, 10) || 0,
											pf: parseInt(targetQueue.pf, 10) || 0,
											tc: parseInt(targetQueue.tc, 10) || 0,
											asb: parseInt(targetQueue.asb, 10) || 0,
											ach: parseInt(targetQueue.ach, 10) || 0,
										},
									});
									showMessage("Target percentages saved!", "success");
								} catch (err) {
									showMessage(
										err instanceof Error ? err.message : "Failed to save",
										"error",
									);
								}
							}}
							disabled={targetSum > 100}
						>
							Save Target Percents
						</button>
					</div>
				)}
			</article>
		</main>
	);
}
