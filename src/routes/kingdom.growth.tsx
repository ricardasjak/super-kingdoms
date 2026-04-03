import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { MaxButton } from "../components/max-button";
import { Tooltip } from "../components/Tooltip";
import { GAME_PARAMS } from "../constants/game-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";
import type { BuildingType, MilitaryUnitType } from "../types/game";
import {
	calculateFreeLand,
	calculateIncomeMultiplier,
} from "../utils/buildingUtils";

const BUILDINGS_DESC = GAME_PARAMS.buildingsTypes;
const BUILDING_KEYS = Object.keys(BUILDINGS_DESC) as BuildingType[];

export const Route = createFileRoute("/kingdom/growth")({
	component: KingdomGrowthPage,
});

function QueueTooltip({
	count,
	queueArray,
	isRazeMode,
}: {
	count: number;
	queueArray: number[];
	isRazeMode?: boolean;
}) {
	if (isRazeMode || count <= 0 || !queueArray) return <span>-</span>;

	// Create a comma-separated list of the array values
	const queueString = queueArray.join(" ");

	return (
		<Tooltip isButton content={`Construction queue: ${queueString}`}>
			+{count}
		</Tooltip>
	);
}

function KingdomGrowthPage() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const buildings = myKingdom?.buildings;
	const buildBuildings = useMutation(api.kingdoms.buildBuildings);
	const razeBuildings = useMutation(api.kingdoms.razeBuildings);
	const saveAutoBuildSettings = useMutation(api.kingdoms.saveAutoBuildSettings);
	const toggleAutoExplore = useMutation(api.kingdoms.toggleAutoExplore);
	const runAutoBuild = useMutation(api.kingdoms.autoBuild);
	const toggleAutoBuild = useMutation(api.kingdoms.toggleAutoBuild);

	const INITIAL_BUILD_QUEUE = Object.fromEntries(
		BUILDING_KEYS.map((k) => [k, ""]),
	) as Record<BuildingType, string>;

	const [buildQueue, setBuildQueue] = useState(INITIAL_BUILD_QUEUE);
	const [targetQueue, setTargetQueue] = useState(INITIAL_BUILD_QUEUE);
	const [targetInitialized, setTargetInitialized] = useState(false);
	const [isBuilding, setIsBuilding] = useState(false);
	const [isRazeMode, setIsRazeMode] = useState(false);
	const { showMessage } = useKingdomMessage();

	useEffect(() => {
		if (buildings && !targetInitialized) {
			const target = buildings.target;
			if (target) {
				setTargetQueue(
					Object.fromEntries(
						BUILDING_KEYS.map((k) => [k, target[k].toString()]),
					) as Record<BuildingType, string>,
				);
			} else if (myKingdom?.land) {
				const total = BUILDING_KEYS.reduce((sum, k) => sum + buildings[k], 0);

				if (total > 0) {
					setTargetQueue(
						Object.fromEntries(
							BUILDING_KEYS.map((k) => [
								k,
								Math.round((buildings[k] / myKingdom.land) * 100).toString(),
							]),
						) as Record<BuildingType, string>,
					);
				}
			}
			setTargetInitialized(true);
		}
	}, [buildings, targetInitialized, myKingdom?.land]);

	if (!myKingdom || !buildings) return null;

	const isBuildingUnlocked = (buildingKey: BuildingType) => {
		const building = GAME_PARAMS.buildingsTypes[buildingKey];
		if (!building?.researchRequired) return true;

		const researchData = myKingdom.research[building.researchRequired];

		return (researchData?.perc ?? 0) >= 100;
	};

	const freeLand = calculateFreeLand(
		myKingdom.land,
		buildings,
		buildings.queue,
	);

	const queuedCounts = Object.fromEntries(
		BUILDING_KEYS.map((k) => [
			k,
			(buildings.queue?.[k] || []).reduce((sum, val) => sum + val, 0),
		]),
	) as Record<BuildingType, number>;

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
	const refundAmount = requestSum * Math.floor(buildingCost / 2);

	const actualPercent = (count: number) => {
		if (!myKingdom.land) return "0.0%";
		return `${((count / myKingdom.land) * 100).toFixed(1)}%`;
	};

	const maxBuildings = Math.min(
		freeLand,
		Math.floor(myKingdom.money / buildingCost),
	);
	const maxBuildingsRounded =
		Math.floor(maxBuildings / GAME_PARAMS.buildings.duration) *
		GAME_PARAMS.buildings.duration;

	// Tooltip calculations
	const popBonus = (myKingdom.research.pop?.perc ?? 0) / 100;
	const resCapacityBoosted = Math.floor(
		GAME_PARAMS.buildings.resCapacity * (1 + popBonus),
	);

	const incomeMultiplier = calculateIncomeMultiplier(
		myKingdom.research.money?.perc ?? 0,
	);
	const resIncome = Math.round(
		resCapacityBoosted * GAME_PARAMS.income.population * incomeMultiplier,
	);
	const smIncome = Math.round(GAME_PARAMS.income.sm * incomeMultiplier);

	// Exploration Logic
	const currentExploreLevel = Number(myKingdom.autoExplore || 0);
	const exploreLevelMultiplier =
		currentExploreLevel > 0
			? GAME_PARAMS.explore.levelMultipliers[currentExploreLevel - 1]
			: 1;

	const handleExploreLevelChange = async (newLevel: number) => {
		try {
			await toggleAutoExplore({ autoExplore: newLevel });
		} catch (error) {
			console.error("Failed to update auto explore level", error);
			showMessage(
				error instanceof Error ? error.message : "Update failed",
				"error",
			);
		}
	};

	const baseExploreCost = GAME_PARAMS.explore.cost(myKingdom.land);
	let landMultiplier = 1;
	if (myKingdom.land < 1000) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
	} else if (myKingdom.land < 2500) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
	} else if (myKingdom.land < 5000) {
		landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];
	}
	const exploreCostPerLand = Math.round(
		baseExploreCost * exploreLevelMultiplier * landMultiplier,
	);

	// Project expenses calculation
	// (1.5 * exploreRatio * land * (exploreCostPerLand + buildingCost) / 24) / oneTickIncome
	const exploreRatio = currentExploreLevel * 0.01;
	const projectExpenseValue =
		(1.5 *
			exploreRatio *
			myKingdom.land *
			(exploreCostPerLand + buildingCost)) /
		24;
	const projectExpensesPerc =
		myKingdom.moneyIncome > 0 && exploreRatio > 0
			? Math.min(100, (projectExpenseValue / myKingdom.moneyIncome) * 100)
			: 0;

	const unitConfigs = GAME_PARAMS.military.units;
	const UNIT_KEYS = Object.keys(unitConfigs) as MilitaryUnitType[];

	const raxUsage = UNIT_KEYS.reduce((sum, key) => {
		const config = unitConfigs[key];
		const count =
			(myKingdom.military[key as keyof typeof myKingdom.military] as number) ||
			0;
		// Special case: asb units don't use rax space
		if (config.buildingRequired === "asb") return sum;
		return sum + count * config.housing;
	}, 0);

	const raxCapacity = buildings.rax * GAME_PARAMS.buildings.raxCapacity;
	const raxUtilization =
		raxCapacity > 0 ? Math.floor((raxUsage / raxCapacity) * 100) : 0;

	const powerBonus = (myKingdom.research.power?.perc ?? 0) / 100;
	const fusionBonus =
		(myKingdom.research.r_fusion?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.r_fusion?.bonus ?? 0) / 100
			: 0;
	const coreBonus =
		(myKingdom.research.r_core?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.r_core?.bonus ?? 0) / 100
			: 0;
	const powerProductionPerPlant = Math.floor(
		GAME_PARAMS.buildings.plantProduction *
			(1 + powerBonus + fusionBonus + coreBonus),
	);

	const tcDiscount = GAME_PARAMS.military.calculateTcDiscount(
		buildings.tc,
		myKingdom.land,
	);

	const handleMaxClick = (key: string) => {
		const bldKey = key as keyof Omit<
			typeof buildings,
			"queue" | "target" | "rubble"
		>;
		const targetMax = isRazeMode
			? (buildings[bldKey] as number)
			: maxBuildingsRounded;
		if (targetMax <= 0) return;
		setBuildQueue({
			...INITIAL_BUILD_QUEUE,
			[key]: targetMax.toString(),
		});
	};

	const handleBuildOrRaze = async (e: React.FormEvent) => {
		e.preventDefault();

		if (requestSum <= 0) {
			showMessage(
				`Please enter a valid amount of buildings to ${
					isRazeMode ? "raze" : "construct"
				}.`,
				"error",
			);
			return;
		}

		setIsBuilding(true);
		try {
			const buildingArgs = Object.fromEntries(
				BUILDING_KEYS.map((k) => [k, parseInt(buildQueue[k], 10) || 0]),
			) as Record<BuildingType, number>;

			if (isRazeMode) {
				await razeBuildings({
					...buildingArgs,
					ach: 0,
				});
				showMessage("Buildings successfully razed!", "success");
			} else {
				if (requestSum > freeLand) {
					throw new Error("Not enough free land!");
				}
				if (myKingdom.money < totalCost) {
					throw new Error("Not enough money!");
				}

				await buildBuildings({
					...buildingArgs,
					ach: 0,
				});
			}
			setBuildQueue(INITIAL_BUILD_QUEUE);
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Action failed",
				"error",
			);
		} finally {
			setIsBuilding(false);
		}
	};

	const handleAutoBuildClick = async () => {
		try {
			const result = await runAutoBuild();
			if (result.success && result.changed) {
				showMessage(
					"Successfully queued Land and Buildings via Auto-Growth!",
					"success",
				);
			} else if (result.success) {
				showMessage(
					"Nothing to grow. Check your targets, limits, land, and money.",
					"warning",
				);
			}
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Auto-Growth failed",
				"error",
			);
		}
	};

	return (
		<section className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Growth</h2>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								flexWrap: "wrap",
							}}
						>
							<p style={{ margin: 0 }}>Current structures and facilities</p>
							{projectExpensesPerc > 0 && (
								<>
									<span style={{ color: "var(--pico-muted-color)" }}>•</span>
									<p style={{ margin: 0, fontSize: "0.9rem" }}>
										Projected expenses to income:{" "}
										<strong
											style={{
												color:
													projectExpensesPerc > 80
														? "var(--pico-del-color)"
														: projectExpensesPerc > 50
															? "#d97706"
															: "var(--pico-ins-color)",
											}}
										>
											{Math.round(projectExpensesPerc)}%
										</strong>
									</p>
								</>
							)}
						</div>
					</hgroup>
				</header>

				<form
					onSubmit={(e) => e.preventDefault()}
					style={{ marginBottom: "1rem" }}
				>
					<article
						style={{
							padding: "0.75rem 1rem",
							marginBottom: "1rem",
							backgroundColor: "var(--pico-card-sectioning-background-color)",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "1.5rem",
								flexWrap: "wrap",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									minWidth: "150px",
								}}
							>
								<strong style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
									Auto-Exploration:
								</strong>
							</div>

							<div
								style={{
									flex: 1,
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									minWidth: "300px",
								}}
							>
								<div
									style={{
										flex: 1,
										display: "flex",
										flexDirection: "column",
										position: "relative",
									}}
								>
									<input
										type="range"
										min="0"
										max="10"
										step="1"
										value={currentExploreLevel}
										onChange={(e) =>
											handleExploreLevelChange(
												Number.parseInt(e.target.value, 10),
											)
										}
										style={{
											marginBottom: 0,
											height: "1.5rem",
											cursor: "pointer",
										}}
									/>
									{currentExploreLevel > 0 &&
										Math.floor(myKingdom.land * (currentExploreLevel * 0.01)) <
											24 && (
											<div
												style={{
													color: "#e67e22",
													fontSize: "0.65rem",
													fontWeight: "bold",
													display: "flex",
													alignItems: "center",
													gap: "0.3rem",
													whiteSpace: "nowrap",
													position: "absolute",
													top: "1.4rem",
													left: 0,
												}}
											>
												<span>⚠️</span>
												<span>explorer will never pick 24 land to explore</span>
											</div>
										)}
								</div>
								{/* Limit Chip now sits here immediately after the slider */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										minWidth: "100px",
									}}
								>
									<span
										style={{
											padding: "2px 10px",
											borderRadius: "12px",
											fontSize: "0.75rem",
											fontWeight: "bold",
											whiteSpace: "nowrap",
											backgroundColor:
												currentExploreLevel === 0
													? "rgba(149, 165, 166, 0.15)"
													: currentExploreLevel >= 10
														? "rgba(192, 57, 43, 0.3)"
														: currentExploreLevel >= 8
															? "rgba(231, 76, 60, 0.2)"
															: "rgba(46, 204, 113, 0.15)",
											color:
												currentExploreLevel === 0
													? "#7f8c8d"
													: currentExploreLevel >= 10
														? "#96281b"
														: currentExploreLevel >= 8
															? "#e74c3c"
															: "#27ae60",
											border: `1px solid ${
												currentExploreLevel === 0
													? "rgba(149, 165, 166, 0.3)"
													: currentExploreLevel >= 10
														? "rgba(150, 40, 27, 0.5)"
														: currentExploreLevel >= 8
															? "rgba(231, 76, 60, 0.4)"
															: "rgba(39, 174, 96, 0.3)"
											}`,
										}}
									>
										{currentExploreLevel === 0
											? "Off"
											: `${currentExploreLevel}% Limit`}
									</span>
								</div>
							</div>

							{currentExploreLevel > 0 && (
								<div
									style={{
										fontSize: "0.85rem",
										display: "flex",
										alignItems: "center",
										gap: "1rem",
										paddingLeft: "1rem",
										borderLeft: "1px solid var(--pico-border-color)",
									}}
								>
									<div style={{ display: "flex", flexDirection: "column" }}>
										<div style={{ display: "flex", gap: "0.3rem" }}>
											<strong>
												{(exploreLevelMultiplier * landMultiplier).toFixed(3)}x
											</strong>
											<span style={{ color: "var(--pico-muted-color)" }}>
												multiplier
											</span>
										</div>
										<div style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
											${exploreCostPerLand.toLocaleString()}{" "}
											<span
												style={{
													fontWeight: "normal",
													color: "var(--pico-muted-color)",
												}}
											>
												/ land piece
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</article>
				</form>

				<form onSubmit={handleBuildOrRaze}>
					<figure>
						<table className="striped">
							<thead>
								<tr>
									<th scope="col" style={{ width: "25%" }}>
										Building Type
									</th>
									<th scope="col">Actual %</th>
									<th scope="col">Count</th>
									<th scope="col">In Queue</th>
									{myKingdom.autoBuild && !isRazeMode && (
										<th scope="col">Target %</th>
									)}
									<th scope="col">{isRazeMode ? "All" : "Max"}</th>
									<th scope="col" style={{ width: "160px" }}>
										{isRazeMode ? "Raze" : "Build"}
									</th>
								</tr>
							</thead>
							<tbody>
								{BUILDING_KEYS.filter(isBuildingUnlocked).map((key) => {
									const label = BUILDINGS_DESC[key].label;
									const count = buildings[key];

									const getTooltip = () => {
										switch (key) {
											case "res":
												return `Pop capacity: ${resCapacityBoosted} | Income: $${resIncome.toLocaleString()} | Population is used to train units`;
											case "sm":
												return `Income per mine: $${smIncome.toLocaleString()}`;
											case "plants":
												return `Production: ${powerProductionPerPlant.toLocaleString()} power | Total Net: ${myKingdom.powerIncome.toLocaleString()} power/tick`;
											case "rax":
												return `Mil space: ${
													GAME_PARAMS.buildings.raxCapacity
												} | ${
													raxCapacity - raxUsage >= 0 ? "Surplus" : "Deficit"
												}: ${Math.abs(
													(raxCapacity - raxUsage) /
														GAME_PARAMS.buildings.raxCapacity,
												).toFixed(1)} | Capacity: ${raxUtilization}%`;
											case "pf":
												return "Probes production: 1 probe";
											case "tc":
												return `Military discount: ${tcDiscount}%${
													tcDiscount >= 30 ? " (Maximum reached)" : ""
												}`;
											case "asb":
												return `Capacity per bay: ${
													GAME_PARAMS.buildings.asbCapacity
												} space | Total: ${
													buildings.asb * GAME_PARAMS.buildings.asbCapacity
												} | Used: ${
													(myKingdom.military.tf || 0) * 2 +
													(myKingdom.military.f74 || 0)
												}`;
											default:
												return "";
										}
									};

									return (
										<tr
											key={key}
											style={{ opacity: isRazeMode && count <= 0 ? 0.5 : 1 }}
										>
											<td>
												{label}{" "}
												{getTooltip() && (
													<Tooltip showIcon content={getTooltip()} />
												)}
											</td>
											<td>{actualPercent(count)}</td>
											<td>{count}</td>
											<td>
												<QueueTooltip
													isRazeMode={isRazeMode}
													count={queuedCounts[key]}
													queueArray={buildings.queue?.[key] || []}
												/>
											</td>
											{myKingdom.autoBuild && !isRazeMode && (
												<td>
													<input
														type="number"
														name={key}
														value={targetQueue[key]}
														onChange={handleTargetChange}
														min="0"
														max="100"
													/>
												</td>
											)}
											<td>
												<MaxButton
													onClick={() => handleMaxClick(key)}
													disabled={
														isRazeMode ? count <= 0 : maxBuildingsRounded <= 0
													}
													label={(isRazeMode
														? count
														: maxBuildingsRounded
													).toLocaleString()}
												/>
											</td>
											<td>
												<input
													type="number"
													name={key}
													value={buildQueue[key]}
													onChange={handleInputChange}
													min="0"
													max={isRazeMode ? count : undefined}
													disabled={isBuilding}
													style={{ marginBottom: 0 }}
												/>
											</td>
										</tr>
									);
								})}

								{/* Rubble */}
								{buildings.rubble > 0 && (
									<tr>
										<td>Rubble</td>
										<td>{actualPercent(buildings.rubble)}</td>
										<td>{buildings.rubble}</td>
										<td>-</td>
										{myKingdom.autoBuild && !isRazeMode && <td>-</td>}
										<td>-</td>
										<td>-</td>
									</tr>
								)}
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
									<strong>Available to build:</strong>{" "}
									{maxBuildings.toLocaleString()}
								</p>
								<p>
									<strong>Total {isRazeMode ? "Refund" : "Cost"}:</strong>{" "}
									{isRazeMode
										? refundAmount.toLocaleString()
										: totalCost.toLocaleString()}{" "}
									<small className="text-muted">
										(
										{Math.floor(
											buildingCost / (isRazeMode ? 2 : 1),
										).toLocaleString()}{" "}
										per building)
									</small>
								</p>
							</div>
							<div style={{ textAlign: "right" }}>
								<button
									type="submit"
									disabled={
										isBuilding ||
										(isRazeMode
											? requestSum <= 0
											: requestSum > freeLand ||
												requestSum <= 0 ||
												myKingdom.money < totalCost)
									}
									style={{
										backgroundColor: isRazeMode ? "#d81b60" : "",
										borderColor: isRazeMode ? "#d81b60" : "",
									}}
								>
									{isBuilding
										? isRazeMode
											? "Razing..."
											: "Building..."
										: isRazeMode
											? "Raze Buildings"
											: "Build buildings"}
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
								await toggleAutoBuild({ autoBuild: isChecked });
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
							<span
								style={{
									fontSize: "0.85rem",
									color: "var(--pico-muted-color)",
								}}
							>
								(Target percentages must sum to &le; 100%)
							</span>
						</p>
						<div style={{ display: "flex", gap: "1rem" }}>
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
												ach: 0,
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
								style={{ marginBottom: 0 }}
							>
								Save Target Percents
							</button>
							<button
								type="button"
								className="contrast"
								onClick={handleAutoBuildClick}
								style={{ marginBottom: 0 }}
							>
								▶ Run Auto-Growth
							</button>
						</div>
					</div>
				)}
			</article>

			<article>
				<footer
					style={{
						marginTop: "4rem",
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
						<label htmlFor="raze-mode" style={{ fontSize: "0.9rem" }}>
							<input
								type="checkbox"
								id="raze-mode"
								role="switch"
								aria-checked={isRazeMode}
								checked={isRazeMode}
								onChange={(e) => {
									setIsRazeMode(e.target.checked);
									setBuildQueue(INITIAL_BUILD_QUEUE);
								}}
							/>
							Raze Buildings
						</label>
					</div>
				</footer>
			</article>
		</section>
	);
}
