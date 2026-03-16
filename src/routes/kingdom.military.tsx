import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
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
	"hgl",
	"ht",
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
	f74: "Interceptor Drones",
	t: "Tanks",
	hgl: "High Guard Lancers",
	ht: "Hover Tanks",
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
	hgl: "",
	ht: "",
};

function getUnitCost(key: keyof typeof UNITS, tcCount: number, land: number) {
	const baseCost = UNITS[key].cost;
	if (key === "sol") return baseCost;
	const discount = GAME_PARAMS.military.calculateTcDiscount(tcCount, land);
	return Math.floor((baseCost * (100 - discount)) / 100);
}

function roundToDuration(value: number, duration: number) {
	return Math.floor(value / duration) * duration;
}

function QueueTooltip({
	count,
	queueArray,
}: {
	count: number;
	queueArray: number[];
}) {
	if (count <= 0 || !queueArray) return <span>-</span>;

	const queueString = queueArray.filter((x) => x > 0).join(", ");

	return (
		<span
			data-tooltip={`Training queue: ${queueString}`}
			style={{ cursor: "help" }}
		>
			+{count}
		</span>
	);
}

function KingdomMilitaryPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const military = myKingdom?.military;
	const trainMilitary = useMutation(api.kingdoms.trainMilitary);

	const [trainQueue, setTrainQueue] = useState(INITIAL_TRAIN_QUEUE);
	const [soldiersToTrain, setSoldiersToTrain] = useState("");
	const [isTraining, setIsTraining] = useState(false);
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
	const remainingSoldierCapacity = Math.min(
		maxByPop - soldiersInQueue,
		maxByMoney,
	);
	const remainingSoldierCapacityRounded = roundToDuration(
		remainingSoldierCapacity,
		GAME_PARAMS.military.soldierDuration,
	);

	const UNITS_WITHOUT_SOLDIER_COST = ["tf", "f74"];

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
			showMessage("Soldiers successfully queued for training!", "success");
		} catch (error) {
			console.error(error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to train soldiers";
			showMessage(errorMessage, "error");
		} finally {
			setIsTraining(false);
		}
	};

	const totalCost = UNIT_KEYS.reduce((sum, key) => {
		const count = parseInt(trainQueue[key], 10) || 0;
		return sum + count * getUnitCost(key, tcCount, land);
	}, 0);

	const soldiersUsed = UNIT_KEYS.reduce((sum, key) => {
		if (UNITS_WITHOUT_SOLDIER_COST.includes(key)) return sum;
		return sum + (parseInt(trainQueue[key], 10) || 0);
	}, 0);

	const handleTrain = async (e: React.FormEvent) => {
		e.preventDefault();

		if (requestSum <= 0) {
			showMessage("Please enter a valid amount of units to train.", "error");
			return;
		}

		if (myKingdom.money < totalCost) {
			showMessage("Not enough money!", "error");
			return;
		}

		if (soldiersUsed > currentSoldiers) {
			showMessage(
				`Not enough soldiers! Need ${soldiersUsed}, have ${currentSoldiers - soldiersInQueue}.`,
				"error",
			);
			return;
		}

		setIsTraining(true);
		try {
			await trainMilitary({
				sol: -soldiersUsed,
				sci: 0,
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
			setTrainQueue(INITIAL_TRAIN_QUEUE);
			showMessage(
				"Military units successfully queued for training!",
				"success",
			);
		} catch (error) {
			console.error(error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to train military";
			showMessage(errorMessage, "error");
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
									<td>Soldiers</td>
									<td>{(military.sol as number).toLocaleString()}</td>
									<td>{soldiersInQueue.toLocaleString()}</td>
									<td>${getUnitCost("sol", tcCount, land)}</td>
									<td>
										<button
											type="button"
											onClick={() =>
												setSoldiersToTrain(
													remainingSoldierCapacityRounded.toString(),
												)
											}
											disabled={remainingSoldierCapacity <= 0}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												cursor:
													remainingSoldierCapacity <= 0
														? "not-allowed"
														: "pointer",
											}}
										>
											{remainingSoldierCapacity.toLocaleString()}
										</button>
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
						}}
					>
						<button
							type="submit"
							disabled={
								isTraining ||
								soldiersCount <= 0 ||
								remainingSoldierCapacity <= 0
							}
							aria-busy={isTraining}
						>
							Train Soldiers
						</button>
						<span>
							Cost: <strong>${soldiersCost.toLocaleString()}</strong>
						</span>
					</div>
				</form>

				<hr />

				<form onSubmit={handleTrain}>
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
								{UNIT_KEYS.map((key) => {
									const queueCount = (
										military.queue[key as keyof typeof military.queue] || []
									).reduce((a: number, b: number) => a + b, 0);
									const unitCount = military[
										key as keyof typeof military
									] as number;
									const unitCost = getUnitCost(key, tcCount, land);
									const maxByMoney = Math.floor(myKingdom.money / unitCost);
									const needsSoldiers =
										!UNITS_WITHOUT_SOLDIER_COST.includes(key);
									const maxBySoldiers = needsSoldiers
										? currentSoldiers
										: Infinity;
									const tfHousingLimit =
										key === "tf"
											? Math.max(
													0,
													myKingdom.buildings.asb *
														GAME_PARAMS.buildings.asbCapacity -
														unitCount -
														queueCount,
												)
											: Infinity;
									const f74HousingLimit =
										key === "f74"
											? Math.max(
													0,
													myKingdom.buildings.ach *
														GAME_PARAMS.buildings.achCapacity -
														unitCount -
														queueCount,
												)
											: Infinity;
									const maxUnits = Math.min(
										maxByMoney,
										maxBySoldiers,
										tfHousingLimit,
										f74HousingLimit,
									);
									const maxUnitsRounded = roundToDuration(
										maxUnits,
										GAME_PARAMS.military.duration,
									);
									const handleMaxClick = () => {
										if (maxUnitsRounded <= 0) return;
										const clearedQueue: Record<string, string> = {};
										for (const k of UNIT_KEYS) {
											clearedQueue[k] = "";
										}
										setTrainQueue({
											...clearedQueue,
											[key]: maxUnitsRounded.toString(),
										});
									};
									return (
										<tr key={key}>
											<td>{UNIT_LABELS[key]}</td>
											<td>{unitCount.toLocaleString()}</td>
											<td>
												{queueCount > 0 ? (
													<QueueTooltip
														count={queueCount}
														queueArray={
															military.queue[
																key as keyof typeof military.queue
															] || []
														}
													/>
												) : (
													"-"
												)}
											</td>
											<td>${unitCost}</td>
											<td>
												<button
													type="button"
													onClick={handleMaxClick}
													disabled={maxUnits <= 0}
													style={{
														padding: "0.25rem 0.5rem",
														fontSize: "0.875rem",
														cursor: maxUnits <= 0 ? "not-allowed" : "pointer",
													}}
												>
													{maxUnits.toLocaleString()}
												</button>
											</td>
											<td>
												<input
													type="number"
													min="0"
													max={maxUnits}
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
						}}
					>
						<button
							type="submit"
							disabled={isTraining || requestSum <= 0}
							aria-busy={isTraining}
						>
							Train Military
						</button>
						<span>
							Total Cost: <strong>${totalCost.toLocaleString()}</strong>
						</span>
					</div>
				</form>
			</article>
		</main>
	);
}
