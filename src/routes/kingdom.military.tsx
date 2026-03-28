import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { MaxButton } from "../components/max-button";
import { Tooltip } from "../components/Tooltip";
import { GAME_PARAMS } from "../constants/game-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";

export const Route = createFileRoute("/kingdom/military")({
	component: KingdomMilitaryPage,
});

const UNITS = GAME_PARAMS.military.units;

const UNIT_KEYS = [
	"tr",
	"dr",
	"ft",
	"tf",
	"lt",
	"ld",
	"lf",
	"f74",
	"t",
	"ht",
	"sci",
] as const;

const UNIT_LABELS: Record<string, string> = {
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

const INITIAL_TRAIN_QUEUE: Record<string, string> = {
	sol: "",
	tr: "",
	dr: "",
	ft: "",
	tf: "",
	lt: "",
	ld: "",
	lf: "",
	f74: "",
	t: "",
	ht: "",
	sci: "",
};

const getUnitTooltip = (key: string) => {
	const unit = UNITS[key as keyof typeof UNITS];
	const nwValue =
		GAME_PARAMS.nw.units[key as keyof typeof GAME_PARAMS.nw.units];
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
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const military = myKingdom?.military;
	const trainMilitary = useMutation(api.kingdoms.trainMilitary);
	const disbandMilitary = useMutation(api.kingdoms.disbandMilitary);

	const [trainQueue, setTrainQueue] = useState(INITIAL_TRAIN_QUEUE);
	const [soldiersToTrain, setSoldiersToTrain] = useState("");
	const [isTraining, setIsTraining] = useState(false);
	const [isDisbandMode, setIsDisbandMode] = useState(false);
	const { showMessage } = useKingdomMessage();

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/create" });
		return null;
	}

	if (!military) {
		return <p>Military not initialized</p>;
	}

	const buildings = myKingdom.buildings;
	const tcCount = buildings?.tc ?? 0;
	const land = myKingdom.land;

	const requestSum = Object.values(trainQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const soldiersCount = parseInt(soldiersToTrain, 10) || 0;
	const soldiersCost = soldiersCount * getUnitCost("sol", tcCount, land);

	const currentSoldiers = military.sol as number;
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
				sol: soldiersCount,
				sci: 0,
				tr: 0,
				dr: 0,
				ft: 0,
				tf: 0,
				lt: 0,
				ld: 0,
				lf: 0,
				f74: 0,
				t: 0,
				hgl: 0,
				ht: 0,
			});
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
			if (isDisbandMode) {
				await disbandMilitary({
					sol: parseInt(trainQueue.sol, 10) || 0,
					sci: parseInt(trainQueue.sci, 10) || 0,
					tr: parseInt(trainQueue.tr, 10) || 0,
					dr: parseInt(trainQueue.dr, 10) || 0,
					ft: parseInt(trainQueue.ft, 10) || 0,
					tf: parseInt(trainQueue.tf, 10) || 0,
					lt: parseInt(trainQueue.lt, 10) || 0,
					ld: parseInt(trainQueue.ld, 10) || 0,
					lf: parseInt(trainQueue.lf, 10) || 0,
					f74: parseInt(trainQueue.f74, 10) || 0,
					t: parseInt(trainQueue.t, 10) || 0,
					hgl: parseInt(trainQueue.hgl, 10) || 0,
					ht: parseInt(trainQueue.ht, 10) || 0,
				});
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
					sol: 0,
					sci: parseInt(trainQueue.sci, 10) || 0,
					tr: parseInt(trainQueue.tr, 10) || 0,
					dr: parseInt(trainQueue.dr, 10) || 0,
					ft: parseInt(trainQueue.ft, 10) || 0,
					tf: parseInt(trainQueue.tf, 10) || 0,
					lt: parseInt(trainQueue.lt, 10) || 0,
					ld: parseInt(trainQueue.ld, 10) || 0,
					lf: parseInt(trainQueue.lf, 10) || 0,
					f74: parseInt(trainQueue.f74, 10) || 0,
					t: parseInt(trainQueue.t, 10) || 0,
					hgl: parseInt(trainQueue.hgl, 10) || 0,
					ht: parseInt(trainQueue.ht, 10) || 0,
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

	return (
		<main className="container">
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
											<input
												type="number"
												min="0"
												max={remainingSoldierCapacity}
												placeholder="0"
												value={soldiersToTrain}
												onChange={(e) => setSoldiersToTrain(e.target.value)}
											/>
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
								<col style={{ width: "15%" }} />
								<col style={{ width: "15%" }} />
							</colgroup>
							<thead>
								<tr>
									<th scope="col">Unit Name</th>
									<th scope="col">You own</th>
									<th scope="col">In training</th>
									<th scope="col">{isDisbandMode ? "Refund" : "Cost"}</th>
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
									if (isDisbandMode) return true;

									// Research check for basic unlocking
									const techInfo =
										GAME_PARAMS.militaryTechTree[
											key as keyof typeof GAME_PARAMS.militaryTechTree
										];

									const researchData = (
										myKingdom.research as Record<
											string,
											{ pts: number; perc: number }
										>
									)[key];

									const isUnlocked =
										!techInfo || (researchData?.perc ?? 0) >= 100;
									if (!isUnlocked) return false;

									// Obsolete unit check (hide lower tiers if higher ones researched)
									const isResearched = (k: string) =>
										((
											myKingdom.research as Record<
												string,
												{ pts: number; perc: number }
											>
										)[k]?.perc ?? 0) >= 100;

									if (
										key === "tr" &&
										(isResearched("dr") || isResearched("ft"))
									)
										return false;
									if (key === "dr" && isResearched("ft")) return false;
									if (
										key === "lt" &&
										(isResearched("ld") || isResearched("lf"))
									)
										return false;
									if (key === "ld" && isResearched("lf")) return false;

									return true;
								}).map((key) => {
									const queueCount = (
										military.queue[key as keyof typeof military.queue] || []
									).reduce((a: number, b: number) => a + b, 0);
									const unitCount = military[
										key as keyof typeof military
									] as number;
									const unitCost = getUnitCost(key, tcCount, land);
									const maxByMoney = Math.floor(myKingdom.money / unitCost);
									const unitSolCost =
										(UNITS[key] as (typeof UNITS)["tr"]).sol || 0;
									const maxBySoldiers =
										unitSolCost > 0
											? Math.floor(currentSoldiers / unitSolCost)
											: Infinity;
									const tfCount = military.tf || 0;
									const f74Count = military.f74 || 0;
									const tfQueue = (military.queue.tf || []).reduce(
										(a, b) => a + b,
										0,
									);
									const f74Queue = (military.queue.f74 || []).reduce(
										(a, b) => a + b,
										0,
									);

									const tfHousing = GAME_PARAMS.military.units.tf.housing;
									const f74Housing = GAME_PARAMS.military.units.f74.housing;

									const asbUsed =
										(tfCount + tfQueue) * tfHousing +
										(f74Count + f74Queue) * f74Housing;
									const asbTotalCapacity =
										myKingdom.buildings.asb * GAME_PARAMS.buildings.asbCapacity;
									const asbAvailableSpace = Math.max(
										0,
										asbTotalCapacity - asbUsed,
									);

									let housingLimit = Infinity;
									if (key === "tf") {
										housingLimit = Math.floor(asbAvailableSpace / tfHousing);
									} else if (key === "f74") {
										housingLimit = Math.floor(asbAvailableSpace / f74Housing);
									}

									const maxUnits = Math.min(
										maxByMoney,
										maxBySoldiers,
										housingLimit,
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
										const clearedQueue: Record<string, string> = {
											...INITIAL_TRAIN_QUEUE,
										};
										setTrainQueue({
											...clearedQueue,
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
														+{queueCount}
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
														${unitCost}{" "}
														{unitSolCost > 0 && (
															<span style={{ fontSize: "0.8rem" }}>
																(+ {unitSolCost} 🪖)
															</span>
														)}
													</>
												)}
											</td>
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

				<footer
					style={{
						marginTop: "4rem",
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
					</div>
				</footer>
			</article>
		</main>
	);
}
