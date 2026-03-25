import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Tooltip } from "../components/Tooltip";
import { GAME_PARAMS } from "../constants/game-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";
import {
	calculateFreeLand,
	calculateIncomeMultiplier,
} from "../utils/buildingUtils";

export const Route = createFileRoute("/kingdom/buildings")({
	component: KingdomBuildingsPage,
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

function KingdomBuildingsPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const buildings = myKingdom?.buildings;
	const buildBuildings = useMutation(api.kingdoms.buildBuildings);
	const razeBuildings = useMutation(api.kingdoms.razeBuildings);
	const saveAutoBuildSettings = useMutation(api.kingdoms.saveAutoBuildSettings);

	const INITIAL_BUILD_QUEUE = {
		res: "",
		sm: "",
		plants: "",
		rax: "",
		pf: "",
		tc: "",
		asb: "",
		ach: "",
	};

	const [buildQueue, setBuildQueue] = useState(INITIAL_BUILD_QUEUE);
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
	const [isRazeMode, setIsRazeMode] = useState(false);
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

				if (total > 0 && myKingdom?.land) {
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
	}, [buildings, targetInitialized, myKingdom?.land]);

	if (myKingdom === undefined) {
		return (
			<main className="container">
				<article aria-busy="true">Loading kingdom...</article>
			</main>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/create" });
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

	const isBuildingUnlocked = (buildingKey: string) => {
		for (const [unitKey, techInfo] of Object.entries(
			GAME_PARAMS.militaryTechTree,
		)) {
			if (techInfo && techInfo.building === buildingKey) {
				const researchData = (
					myKingdom.research as Record<string, { pts: number; perc: number }>
				)[unitKey];
				return (researchData?.perc ?? 0) >= 100;
			}
		}
		return true; // No requirement means unlocked
	};

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

	const raxUsage =
		myKingdom.military.sol +
		myKingdom.military.tr +
		myKingdom.military.dr +
		myKingdom.military.ft +
		myKingdom.military.lt +
		myKingdom.military.ld +
		myKingdom.military.lf +
		myKingdom.military.sci +
		myKingdom.military.t * 2 +
		myKingdom.military.ht * 2;
	const raxCapacity = buildings.rax * GAME_PARAMS.buildings.raxCapacity;
	const raxUtilization =
		raxCapacity > 0 ? Math.floor((raxUsage / raxCapacity) * 100) : 0;

	const powerBonus = (myKingdom.research.power?.perc ?? 0) / 100;
	const fusionBonus =
		(myKingdom.research.fusion?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.fusion?.bonus ?? 0) / 100
			: 0;
	const coreBonus =
		(myKingdom.research.core?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.core?.bonus ?? 0) / 100
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
			if (isRazeMode) {
				await razeBuildings({
					res: parseInt(buildQueue.res, 10) || 0,
					plants: parseInt(buildQueue.plants, 10) || 0,
					rax: parseInt(buildQueue.rax, 10) || 0,
					sm: parseInt(buildQueue.sm, 10) || 0,
					pf: parseInt(buildQueue.pf, 10) || 0,
					tc: parseInt(buildQueue.tc, 10) || 0,
					asb: parseInt(buildQueue.asb, 10) || 0,
					ach: parseInt(buildQueue.ach, 10) || 0,
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
					res: parseInt(buildQueue.res, 10) || 0,
					plants: parseInt(buildQueue.plants, 10) || 0,
					rax: parseInt(buildQueue.rax, 10) || 0,
					sm: parseInt(buildQueue.sm, 10) || 0,
					pf: parseInt(buildQueue.pf, 10) || 0,
					tc: parseInt(buildQueue.tc, 10) || 0,
					asb: parseInt(buildQueue.asb, 10) || 0,
					ach: parseInt(buildQueue.ach, 10) || 0,
				});
				showMessage(
					"Buildings successfully queued for construction!",
					"success",
				);
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

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Buildings</h2>
						<p>Current structures and facilities</p>
					</hgroup>
				</header>

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
									{!isRazeMode && <th scope="col">Cost</th>}
									<th scope="col">{isRazeMode ? "All" : "Max"}</th>
									<th scope="col" style={{ width: "160px" }}>
										{isRazeMode ? "Raze" : "Build"}
									</th>
								</tr>
							</thead>
							<tbody>
								{/* Residences */}
								<tr>
									<td>
										Residences{" "}
										<Tooltip
											showIcon
											content={`Pop capacity: ${resCapacityBoosted} | Income: $${resIncome.toLocaleString()} | Population is used to train units`}
										/>
									</td>
									<td>{actualPercent(buildings.res)}</td>
									<td>{buildings.res}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.res}
											queueArray={buildings.queue?.res || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("res")}
											disabled={
												isRazeMode
													? buildings.res <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.res <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.res
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="res"
											value={buildQueue.res}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.res : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Star Mines */}
								<tr>
									<td>
										Star Mines{" "}
										<Tooltip
											showIcon
											content={`Income per mine: $${smIncome.toLocaleString()}`}
										/>
									</td>
									<td>{actualPercent(buildings.sm)}</td>
									<td>{buildings.sm}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.sm}
											queueArray={buildings.queue?.sm || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("sm")}
											disabled={
												isRazeMode
													? buildings.sm <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.sm <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.sm
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="sm"
											value={buildQueue.sm}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.sm : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Power Plants */}
								<tr>
									<td>
										Power Plants{" "}
										<Tooltip
											showIcon
											content={`Production: ${powerProductionPerPlant.toLocaleString()} power | Total Net: ${myKingdom.powerIncome.toLocaleString()} power/tick`}
										/>
									</td>
									<td>{actualPercent(buildings.plants)}</td>
									<td>{buildings.plants}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.plants}
											queueArray={buildings.queue?.plants || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("plants")}
											disabled={
												isRazeMode
													? buildings.plants <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.plants <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.plants
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="plants"
											value={buildQueue.plants}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.plants : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Barracks */}
								<tr>
									<td>
										Barracks{" "}
										<Tooltip
											showIcon
											content={`Mil space: ${
												GAME_PARAMS.buildings.raxCapacity
											} | ${
												raxCapacity - raxUsage >= 0 ? "Surplus" : "Deficit"
											}: ${Math.abs(
												(raxCapacity - raxUsage) /
													GAME_PARAMS.buildings.raxCapacity,
											).toFixed(1)} | Capacity: ${raxUtilization}%`}
										/>
									</td>
									<td>{actualPercent(buildings.rax)}</td>
									<td>{buildings.rax}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.rax}
											queueArray={buildings.queue?.rax || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("rax")}
											disabled={
												isRazeMode
													? buildings.rax <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.rax <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.rax
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="rax"
											value={buildQueue.rax}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.rax : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Probe Factories */}
								<tr>
									<td>
										Probe Factories{" "}
										<Tooltip showIcon content="Probes production: 1 probe" />
									</td>
									<td>{actualPercent(buildings.pf)}</td>
									<td>{buildings.pf}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.pf}
											queueArray={buildings.queue?.pf || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("pf")}
											disabled={
												isRazeMode
													? buildings.pf <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.pf <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.pf
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="pf"
											value={buildQueue.pf}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.pf : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Training Camps */}
								<tr>
									<td>
										Training Camps{" "}
										<Tooltip
											showIcon
											content={`Military discount: ${tcDiscount}%${
												tcDiscount >= 30 ? " (Maximum reached)" : ""
											}`}
										/>
									</td>
									<td>{actualPercent(buildings.tc)}</td>
									<td>{buildings.tc}</td>
									<td>
										<QueueTooltip
											isRazeMode={isRazeMode}
											count={queuedCounts.tc}
											queueArray={buildings.queue?.tc || []}
										/>
									</td>
									{myKingdom.autoBuild && !isRazeMode && (
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
									{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
									<td>
										<button
											type="button"
											onClick={() => handleMaxClick("tc")}
											disabled={
												isRazeMode
													? buildings.tc <= 0
													: maxBuildingsRounded <= 0
											}
											style={{
												padding: "0.25rem 0.5rem",
												fontSize: "0.875rem",
												width: "100%",
												cursor: (
													isRazeMode
														? buildings.tc <= 0
														: maxBuildingsRounded <= 0
												)
													? "not-allowed"
													: "pointer",
												backgroundColor: isRazeMode ? "#d81b60" : "",
												borderColor: isRazeMode ? "#d81b60" : "",
											}}
										>
											{(isRazeMode
												? buildings.tc
												: maxBuildingsRounded
											).toLocaleString()}
										</button>
									</td>
									<td>
										<input
											type="number"
											name="tc"
											value={buildQueue.tc}
											onChange={handleInputChange}
											min="0"
											max={isRazeMode ? buildings.tc : undefined}
											disabled={isBuilding}
											style={{ marginBottom: 0 }}
										/>
									</td>
								</tr>
								{/* Air Support Bays */}
								{isBuildingUnlocked("asb") && (
									<tr>
										<td>
											Air Support Bays{" "}
											<Tooltip
												showIcon
												content={`Capacity per bay: ${40} TFs | Total capacity: ${buildings.asb * 40} | Used: ${myKingdom.military.tf}`}
											/>
										</td>
										<td>{actualPercent(buildings.asb)}</td>
										<td>{buildings.asb}</td>
										<td>
											<QueueTooltip
												isRazeMode={isRazeMode}
												count={queuedCounts.asb}
												queueArray={buildings.queue?.asb || []}
											/>
										</td>
										{myKingdom.autoBuild && !isRazeMode && (
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
										{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
										<td>
											<button
												type="button"
												onClick={() => handleMaxClick("asb")}
												disabled={
													isRazeMode
														? buildings.asb <= 0
														: maxBuildingsRounded <= 0
												}
												style={{
													padding: "0.25rem 0.5rem",
													fontSize: "0.875rem",
													width: "100%",
													backgroundColor: isRazeMode ? "#d81b60" : "",
													borderColor: isRazeMode ? "#d81b60" : "",
													color: isRazeMode ? "white" : "",
												}}
											>
												{(isRazeMode
													? buildings.asb
													: maxBuildingsRounded
												).toLocaleString()}
											</button>
										</td>
										<td>
											<input
												type="number"
												name="asb"
												value={buildQueue.asb}
												onChange={handleInputChange}
												min="0"
												max={isRazeMode ? buildings.asb : undefined}
												disabled={isBuilding}
												style={{ marginBottom: 0 }}
											/>
										</td>
									</tr>
								)}
								{/* Aegis Control Hubs */}
								{isBuildingUnlocked("ach") && (
									<tr>
										<td>
											Aegis Control Hubs{" "}
											<Tooltip
												showIcon
												content={`Capacity per hub: ${60} F-74s | Total capacity: ${buildings.ach * 60} | Used: ${myKingdom.military.f74}`}
											/>
										</td>
										<td>{actualPercent(buildings.ach)}</td>
										<td>{buildings.ach}</td>
										<td>
											<QueueTooltip
												isRazeMode={isRazeMode}
												count={queuedCounts.ach}
												queueArray={buildings.queue?.ach || []}
											/>
										</td>
										{myKingdom.autoBuild && !isRazeMode && (
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
										{!isRazeMode && <td>${buildingCost.toLocaleString()}</td>}
										<td>
											<button
												type="button"
												onClick={() => handleMaxClick("ach")}
												disabled={
													isRazeMode
														? buildings.ach <= 0
														: maxBuildingsRounded <= 0
												}
												style={{
													padding: "0.25rem 0.5rem",
													fontSize: "0.875rem",
													width: "100%",
													backgroundColor: isRazeMode ? "#d81b60" : "",
													borderColor: isRazeMode ? "#d81b60" : "",
													color: isRazeMode ? "white" : "",
												}}
											>
												{(isRazeMode
													? buildings.ach
													: maxBuildingsRounded
												).toLocaleString()}
											</button>
										</td>
										<td>
											<input
												type="number"
												name="ach"
												value={buildQueue.ach}
												onChange={handleInputChange}
												min="0"
												max={isRazeMode ? buildings.ach : undefined}
												disabled={isBuilding}
												style={{ marginBottom: 0 }}
											/>
										</td>
									</tr>
								)}
								{/* Rubble */}
								<tr>
									<td>Rubble</td>
									<td>{actualPercent(buildings.rubble)}</td>
									<td>{buildings.rubble}</td>
									<td>-</td>
									{myKingdom.autoBuild && !isRazeMode && <td>-</td>}
									{!isRazeMode && <td>-</td>}
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
		</main>
	);
}
