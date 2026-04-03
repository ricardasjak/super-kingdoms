import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { MaxButton } from "../components/max-button";
import { Tooltip } from "../components/Tooltip";
import { GAME_PARAMS } from "../constants/game-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";
import type { MilitaryUnitType, ResearchKey } from "../types/game";

export const Route = createFileRoute("/kingdom/military")({
	component: KingdomMilitaryPage,
});

const UNITS = GAME_PARAMS.military.units;

const UNIT_KEYS = Object.keys(UNITS) as MilitaryUnitType[];

const UNIT_LABELS: Record<MilitaryUnitType, string> = {
	sol: "Soldiers",
	tr: "Troopers",
	dr: "Dragoons",
	ft: "Fighters",
	tf: "Tactical Fighters",
	lt: "Laser Troopers",
	ld: "Laser Dragoons",
	lf: "Laser Fighters",
	f74: "F74 Drones",
	t: "Tanks",
	ht: "Hover Tanks",
	sci: "Scientists",
};

const INITIAL_TRAIN_QUEUE = Object.fromEntries(
	UNIT_KEYS.map((k) => [k, ""]),
) as Record<MilitaryUnitType, string>;

const getUnitTooltip = (key: MilitaryUnitType) => {
	const unit = UNITS[key];
	const nwValue = GAME_PARAMS.nw.units[key];
	if (!unit) return "";
	const row1 = `⚔️ Offense: ${unit.off} | 🛡️ Defense: ${unit.def} | `;
	const row2 = `🏠 Space: ${unit.housing} | ⚡ Power: ${unit.power} | `;
	const row3 = `💎 NW: ${nwValue}`;
	return `${row1}\n${row2}\n${row3}`;
};

function getUnitCost(key: keyof typeof UNITS, tcCount: number, land: number) {
	const baseCost = UNITS[key].cost;
	if (key === "sol" || key === "sci") return baseCost;
	const discount = GAME_PARAMS.military.calculateTcDiscount(tcCount, land);
	return Math.floor((baseCost * (100 - discount)) / 100);
}

function roundToDuration(value: number, duration: number) {
	return Math.floor(value / duration) * duration;
}

function KingdomMilitaryPage() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const military = myKingdom?.military;
	const trainMilitary = useMutation(api.kingdoms.trainMilitary);
	const disbandMilitary = useMutation(api.kingdoms.disbandMilitary);
	const toggleAutoBuild = useMutation(api.kingdoms.toggleAutoBuild);
	const saveMilitaryTargets = useMutation(api.kingdoms.saveMilitaryTargets);
	const runAutoBuild = useMutation(api.kingdoms.autoBuild);

	const [trainQueue, setTrainQueue] = useState(INITIAL_TRAIN_QUEUE);
	const [targetQueue, setTargetQueue] = useState(INITIAL_TRAIN_QUEUE);
	const [isSavingTargets, setIsSavingTargets] = useState(false);
	const [soldiersToTrain, setSoldiersToTrain] = useState("");
	const [isTraining, setIsTraining] = useState(false);
	const [isDisbandMode, setIsDisbandMode] = useState(false);

	useEffect(() => {
		if (military?.target) {
			setTargetQueue(
				Object.fromEntries(
					UNIT_KEYS.map((k) => [k, military.target?.[k].toString() || "0"]),
				) as Record<MilitaryUnitType, string>,
			);
		}
	}, [military?.target]);
	const { showMessage } = useKingdomMessage();

	if (!myKingdom || !military) return null;

	const buildings = myKingdom.buildings;
	const tcCount = buildings?.tc ?? 0;
	const land = myKingdom.land;

	const requestSum = Object.values(trainQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const soldiersCount = parseInt(soldiersToTrain, 10) || 0;
	const soldiersCost = soldiersCount * getUnitCost("sol", tcCount, land);

	const currentSoldiers = military.sol;
	const soldiersInQueue = (military.queue.sol || []).reduce((a, b) => a + b, 0);
	const soldierCost = getUnitCost("sol", tcCount, land);
	const maxByPop = Math.floor(
		myKingdom.population * GAME_PARAMS.military.soldiersLimit,
	);
	const maxByMoney = Math.floor(myKingdom.money / soldierCost);
	const remainingSoldierCapacity = Math.max(
		0,
		Math.min(maxByPop - soldiersInQueue, maxByMoney),
	);
	const remainingSoldierCapacityRounded = roundToDuration(
		Math.max(0, remainingSoldierCapacity),
		GAME_PARAMS.military.soldierDuration,
	);

	const handleTrainSoldiers = async (e: React.FormEvent) => {
		e.preventDefault();

		if (soldiersCount <= 0) {
			showMessage("Please enter a valid amount of soldiers to train.", "error");
			return;
		}

		if (soldiersCount > remainingSoldierCapacity) {
			showMessage(
				`Cannot train ${soldiersCount} soldiers. Maximum ${remainingSoldierCapacity} available.`,
				"error",
			);
			return;
		}

		if (myKingdom.money < soldiersCost) {
			showMessage("Not enough money!", "error");
			return;
		}

		setIsTraining(true);
		try {
			await trainMilitary({
				...Object.fromEntries(UNIT_KEYS.map((k) => [k, 0])),
				sol: soldiersCount,
			} as Record<MilitaryUnitType, number>);
			setSoldiersToTrain("");
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Failed to train soldiers",
				"error",
			);
		} finally {
			setIsTraining(false);
		}
	};

	const totalCost = UNIT_KEYS.reduce((sum, key) => {
		const count = parseInt(trainQueue[key], 10) || 0;
		return sum + count * getUnitCost(key, tcCount, land);
	}, 0);

	const soldiersUsed = UNIT_KEYS.reduce((sum, key) => {
		const unitSolCost = (UNITS[key] as (typeof UNITS)["tr"]).sol || 0;
		return sum + (parseInt(trainQueue[key], 10) || 0) * unitSolCost;
	}, 0);

	const targetSum = UNIT_KEYS.reduce(
		(acc, k) => acc + (parseInt(targetQueue[k], 10) || 0),
		0,
	);

	const refundAmount =
		UNIT_KEYS.reduce((sum, key) => {
			const count = parseInt(trainQueue[key], 10) || 0;
			return sum + Math.floor((count * UNITS[key].cost) / 2);
		}, 0) +
		(parseInt(trainQueue.sol, 10) || 0) * Math.floor(UNITS.sol.cost / 2);

	const handleTrainOrDisband = async (e: React.FormEvent) => {
		e.preventDefault();

		if (requestSum <= 0 && (parseInt(trainQueue.sol, 10) || 0) <= 0) {
			showMessage(
				`Please enter a valid amount of units to ${
					isDisbandMode ? "disband" : "train"
				}.`,
				"error",
			);
			return;
		}

		setIsTraining(true);
		try {
			const trainArgs = Object.fromEntries(
				UNIT_KEYS.map((k) => [k, parseInt(trainQueue[k], 10) || 0]),
			) as Record<MilitaryUnitType, number>;

			if (isDisbandMode) {
				await disbandMilitary(trainArgs);
				showMessage("Units successfully disbanded!", "success");
			} else {
				if (myKingdom.money < totalCost) {
					throw new Error("Not enough money!");
				}
				if (soldiersUsed > currentSoldiers) {
					throw new Error(
						`Not enough soldiers! Need ${soldiersUsed}, have ${currentSoldiers}.`,
					);
				}

				await trainMilitary({
					...trainArgs,
					sol: 0,
				});
			}
			setTrainQueue(INITIAL_TRAIN_QUEUE);
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Action failed",
				"error",
			);
		} finally {
			setIsTraining(false);
		}
	};

	const handleSaveTargets = async (e: React.FormEvent) => {
		e.preventDefault();
		const sum = UNIT_KEYS.reduce(
			(acc, k) => acc + (parseInt(targetQueue[k], 10) || 0),
			0,
		);
		if (sum > 100) {
			showMessage("Total targets cannot exceed 100%", "error");
			setIsSavingTargets(false);
			return;
		}

		setIsSavingTargets(true);
		try {
			await saveMilitaryTargets({
				target: Object.fromEntries(
					UNIT_KEYS.map((k) => [k, parseInt(targetQueue[k], 10) || 0]),
				) as Record<MilitaryUnitType, number>,
			});
			showMessage("Military targets saved successfully!", "success");
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Failed to save targets",
				"error",
			);
		} finally {
			setIsSavingTargets(false);
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
		<section>
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Military</h2>
						<p>Train and manage your military forces</p>
					</hgroup>
				</header>

				{!isDisbandMode && (
					<form onSubmit={handleTrainSoldiers}>
						<figure>
							<table className="striped" style={{ tableLayout: "fixed" }}>
								<colgroup>
									<col style={{ width: "25%" }} />
									<col style={{ width: "15%" }} />
									<col style={{ width: "15%" }} />
									<col style={{ width: "15%" }} />
									<col style={{ width: "15%" }} />
									<col style={{ width: "15%" }} />
								</colgroup>
								<thead>
									<tr>
										<th scope="col">Unit Name</th>
										<th scope="col">You own</th>
										<th scope="col">In training</th>
										<th scope="col">Cost</th>
										<th scope="col">Max</th>
										<th scope="col">Train</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
												}}
											>
												🪖 Soldiers
												<Tooltip showIcon content={getUnitTooltip("sol")} />
											</div>
										</td>
										<td>{(military.sol as number).toLocaleString()}</td>
										<td>{soldiersInQueue.toLocaleString()}</td>
										<td>${getUnitCost("sol", tcCount, land)}</td>
										<td>
											<MaxButton
												onClick={() =>
													setSoldiersToTrain(
														remainingSoldierCapacityRounded.toString(),
													)
												}
												disabled={remainingSoldierCapacityRounded <= 0}
												label={remainingSoldierCapacityRounded.toLocaleString()}
											/>
										</td>
										<td>
											{remainingSoldierCapacityRounded <= 0 ? (
												<span
													style={{
														fontSize: "0.8rem",
														color: "var(--pico-muted-color)",
														fontStyle: "italic",
													}}
												>
													{myKingdom.money < soldierCost
														? "Low funds"
														: "Training limit reached"}
												</span>
											) : (
												<input
													type="number"
													min="0"
													max={remainingSoldierCapacity}
													placeholder="0"
													value={soldiersToTrain}
													onChange={(e) => setSoldiersToTrain(e.target.value)}
												/>
											)}
										</td>
									</tr>
								</tbody>
							</table>
						</figure>
						<div
							style={{
								marginTop: "1rem",
								display: "flex",
								gap: "1rem",
								alignItems: "center",
								justifyContent: "flex-end",
							}}
						>
							<span>
								Cost: <strong>${soldiersCost.toLocaleString()}</strong>
							</span>
							<button
								type="submit"
								disabled={
									isTraining ||
									soldiersCount <= 0 ||
									remainingSoldierCapacityRounded <= 0
								}
								aria-busy={isTraining}
								style={{ width: "auto", marginBottom: 0 }}
							>
								Train Soldiers
							</button>
						</div>
					</form>
				)}

				<hr />

				<form onSubmit={handleTrainOrDisband}>
					<figure>
						<table className="striped" style={{ tableLayout: "fixed" }}>
							<colgroup>
								<col style={{ width: "25%" }} />
								<col style={{ width: "15%" }} />
								<col style={{ width: "15%" }} />
								<col style={{ width: "15%" }} />
								{!isDisbandMode && myKingdom.autoBuild && (
									<col style={{ width: "110px" }} />
								)}
								<col style={{ width: "15%" }} />
								<col style={{ width: "15%" }} />
							</colgroup>
							<thead>
								<tr>
									<th scope="col">Unit Name</th>
									<th scope="col">You own</th>
									<th scope="col">In training</th>
									<th scope="col">{isDisbandMode ? "Refund" : "Cost"}</th>
									{!isDisbandMode && myKingdom.autoBuild && (
										<th scope="col">Target *</th>
									)}
									<th scope="col">{isDisbandMode ? "All" : "Max"}</th>
									<th scope="col">{isDisbandMode ? "Disband" : "Train"}</th>
								</tr>
							</thead>
							<tbody>
								{isDisbandMode && (
									<tr>
										<td>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
												}}
											>
												🪖 Soldiers
												<Tooltip showIcon content={getUnitTooltip("sol")} />
											</div>
										</td>
										<td>{(military.sol as number).toLocaleString()}</td>
										<td>-</td>
										<td>
											+${Math.floor(UNITS.sol.cost / 2)}{" "}
											<span style={{ fontSize: "0.8rem" }}>(+ 1 🪖)</span>
										</td>
										<td>
											<button
												type="button"
												className="secondary"
												onClick={() =>
													setTrainQueue({
														...INITIAL_TRAIN_QUEUE,
														sol: military.sol.toString(),
													})
												}
												disabled={military.sol <= 0}
												style={{
													padding: "0.25rem 0.5rem",
													fontSize: "0.875rem",
													backgroundColor: "#d81b60",
													borderColor: "#d81b60",
												}}
											>
												{military.sol.toLocaleString()}
											</button>
										</td>
										<td>
											<input
												type="number"
												min="0"
												placeholder="0"
												value={trainQueue.sol}
												onChange={(e) =>
													setTrainQueue({
														...trainQueue,
														sol: e.target.value,
													})
												}
											/>
										</td>
									</tr>
								)}
								{UNIT_KEYS.filter((key) => {
									if (key === "sol") return false;
									if (isDisbandMode) return true;

									const unitConfig = UNITS[key];
									const { researchRequired: resReq, buildingRequired: bldReq } =
										unitConfig;

									if (resReq && (myKingdom.research[resReq]?.perc ?? 0) < 100)
										return false;
									if (bldReq && (myKingdom.buildings[bldReq] || 0) <= 0)
										return false;

									// Obsolete unit check
									const isRes = (k: ResearchKey) =>
										(myKingdom.research[k]?.perc ?? 0) >= 100;

									const count = military[
										key as keyof typeof military
									] as number;
									const inQueueCount = (
										military.queue[key as keyof typeof military.queue] || []
									).reduce((a, b) => a + b, 0);

									if (count > 0 || inQueueCount > 0) return true;

									if (key === "tr" && (isRes("r_dr") || isRes("r_ft")))
										return false;
									if (key === "dr" && isRes("r_ft")) return false;
									if (key === "lt" && (isRes("r_ld") || isRes("r_lf")))
										return false;
									if (key === "ld" && isRes("r_lf")) return false;
									if (key === "t" && isRes("r_ht")) return false;

									return true;
								}).map((key) => {
									const queueCount = (military.queue[key] || []).reduce(
										(a: number, b: number) => a + b,
										0,
									);
									const unitCount = military[key];
									const unitCost = getUnitCost(key, tcCount, land);

									const unitSolCost = UNITS[key].sol || 0;
									const maxByMoney = Math.floor(myKingdom.money / unitCost);
									const maxBySoldiers =
										unitSolCost > 0
											? Math.floor(currentSoldiers / unitSolCost)
											: Infinity;

									// ASB Space check
									let housingLimit = Infinity;
									if (UNITS[key].buildingRequired === "asb") {
										const asbTotal =
											myKingdom.buildings.asb *
											GAME_PARAMS.buildings.asbCapacity;
										const asbUsed = UNIT_KEYS.reduce((sum, k) => {
											if (UNITS[k].buildingRequired !== "asb") return sum;
											const count = military[k];
											const inQueue = (military.queue[k] || []).reduce(
												(a, b) => a + b,
												0,
											);
											return sum + (count + inQueue) * UNITS[k].housing;
										}, 0);
										housingLimit = Math.floor(
											Math.max(0, asbTotal - asbUsed) / UNITS[key].housing,
										);
									}

									const incomeCap = Infinity;

									const maxUnits = Math.min(
										maxByMoney,
										key === "sci" ? Infinity : maxBySoldiers,
										housingLimit,
										incomeCap,
									);
									const maxUnitsRounded = roundToDuration(
										maxUnits,
										GAME_PARAMS.military.duration,
									);
									const handleMaxClick = () => {
										const targetMax = isDisbandMode
											? unitCount
											: maxUnitsRounded;
										if (targetMax <= 0) return;
										setTrainQueue({
											...INITIAL_TRAIN_QUEUE,
											[key]: targetMax.toString(),
										});
									};
									return (
										<tr key={key}>
											<td>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: "0.5rem",
													}}
												>
													{UNIT_LABELS[key]}
													<Tooltip showIcon content={getUnitTooltip(key)} />
												</div>
											</td>
											<td>{unitCount.toLocaleString()}</td>
											<td>
												{isDisbandMode ? (
													"-"
												) : queueCount > 0 ? (
													<Tooltip
														isButton
														content={`Training queue: ${military.queue[
															key as keyof typeof military.queue
														]
															?.filter((x) => x > 0)
															.join(", ")}`}
													>
														+{queueCount.toLocaleString()}
													</Tooltip>
												) : (
													"-"
												)}
											</td>
											<td>
												{isDisbandMode ? (
													<>
														+${Math.floor(UNITS[key].cost / 2)}{" "}
														{unitSolCost > 0 && (
															<span style={{ fontSize: "0.8rem" }}>
																(+ {unitSolCost} 🪖)
															</span>
														)}
													</>
												) : (
													<>
														${unitCost.toLocaleString()}{" "}
														{unitSolCost > 0 && (
															<span style={{ fontSize: "0.8rem" }}>
																(+ {unitSolCost} 🪖)
															</span>
														)}
													</>
												)}
											</td>
											{!isDisbandMode && myKingdom.autoBuild && (
												<td>
													<input
														type="number"
														min="0"
														placeholder="0"
														value={targetQueue[key]}
														onChange={(e) =>
															setTargetQueue({
																...targetQueue,
																[key]: e.target.value,
															})
														}
														style={{
															padding: "0.2rem 0.5rem",
															margin: 0,
															fontSize: "0.80rem",
														}}
													/>
												</td>
											)}
											<td>
												<MaxButton
													onClick={handleMaxClick}
													disabled={
														isDisbandMode
															? unitCount <= 0
															: maxUnitsRounded <= 0
													}
													label={(isDisbandMode
														? unitCount
														: maxUnitsRounded
													).toLocaleString()}
												/>
											</td>
											<td>
												{maxUnitsRounded <= 0 && !isDisbandMode ? (
													<span
														style={{
															fontSize: "0.8rem",
															color: "var(--pico-muted-color)",
															fontStyle: "italic",
														}}
													>
														{maxByMoney < GAME_PARAMS.military.duration
															? "Low funds"
															: maxBySoldiers < GAME_PARAMS.military.duration &&
																	key !== "sci"
																? "Low soldiers"
																: housingLimit < GAME_PARAMS.military.duration
																	? "No ASB space"
																	: "Maximum reached"}
													</span>
												) : (
													<input
														type="number"
														min="0"
														max={isDisbandMode ? unitCount : maxUnits}
														placeholder="0"
														value={trainQueue[key]}
														onChange={(e) =>
															setTrainQueue({
																...trainQueue,
																[key]: e.target.value,
															})
														}
													/>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</figure>

					<div
						style={{
							marginTop: "1rem",
							display: "flex",
							gap: "1rem",
							alignItems: "center",
							justifyContent: "flex-end",
						}}
					>
						{isDisbandMode ? (
							<span>
								Total Refund: <strong>${refundAmount.toLocaleString()}</strong>
							</span>
						) : (
							<span>
								Total Cost: <strong>${totalCost.toLocaleString()}</strong>
							</span>
						)}
						<button
							type="submit"
							disabled={
								isTraining ||
								(requestSum <= 0 && (parseInt(trainQueue.sol, 10) || 0) <= 0)
							}
							aria-busy={isTraining}
							style={{
								width: "auto",
								marginBottom: 0,
								backgroundColor: isDisbandMode ? "#d81b60" : "",
								borderColor: isDisbandMode ? "#d81b60" : "",
							}}
						>
							{isDisbandMode ? "Disband Units" : "Build Military"}
						</button>
					</div>
				</form>
			</article>

			<article>
				<header>Auto Build</header>

				<p style={{ fontSize: "0.9rem", color: "var(--pico-muted-color)" }}>
					This setting enables automated growth for both your land/buildings and
					military recruitment. Available money each tick is distributed based
					on your defined target percentages.
				</p>

				<label htmlFor="autoBuild">
					<input
						type="checkbox"
						id="autoBuild"
						role="switch"
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
					<div style={{ marginTop: "1.5rem" }}>
						<p style={{ marginBottom: "1rem" }}>
							Military Target Sum:{" "}
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
								onClick={handleSaveTargets}
								disabled={isSavingTargets || targetSum > 100}
								style={{ width: "auto", marginBottom: 0 }}
							>
								{isSavingTargets ? "Saving..." : "Save Target Percents"}
							</button>
							<button
								type="button"
								className="contrast"
								onClick={handleAutoBuildClick}
								style={{ width: "auto", marginBottom: 0 }}
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
						display: "flex",
						justifyContent: "flex-end",
						alignItems: "center",
					}}
				>
					<label htmlFor="disband-mode" style={{ fontSize: "0.9rem" }}>
						<input
							type="checkbox"
							id="disband-mode"
							role="switch"
							aria-checked={isDisbandMode}
							checked={isDisbandMode}
							onChange={(e) => {
								setIsDisbandMode(e.target.checked);
								setTrainQueue(INITIAL_TRAIN_QUEUE);
							}}
						/>
						Disband Units
					</label>
				</footer>
			</article>
		</section>
	);
}
