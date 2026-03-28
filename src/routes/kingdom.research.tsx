import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../../src/constants/game-params";
import { useKingdomMessage } from "../../src/contexts/KingdomMessageContext";
import { MaxButton } from "../components/max-button";
import { Tooltip } from "../components/Tooltip";

export const Route = createFileRoute("/kingdom/research")({
	component: KingdomResearchPage,
});

interface ResearchDisc {
	pts: number;
	perc: number;
}

function KingdomResearchPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const assignPoints = useMutation(api.kingdoms.assignResearchPoints);
	const saveAutoAssign = useMutation(api.kingdoms.saveResearchAutoAssign);
	const hireScientists = useMutation(api.kingdoms.buyScientists);
	const { showMessage } = useKingdomMessage();

	const [assignQueue, setAssignQueue] = useState({
		pop: "",
		power: "",
		mil: "",
		money: "",
		fdc: "",
		warp: "",
		dr: "",
		ft: "",
		tf: "",
		ld: "",
		lf: "",
		hgl: "",
		ht: "",
		fusion: "",
		core: "",
		armor: "",
	});
	const [isAssigning, setIsAssigning] = useState(false);
	const [hireAmount, setHireAmount] = useState("");
	const [isHiring, setIsHiring] = useState(false);
	const [showAllTech, setShowAllTech] = useState(false);

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

	const { research } = myKingdom;

	if (!research) {
		return (
			<main className="container">
				<article>
					<header>Error</header>
					<p>Could not locate research data for your kingdom.</p>
				</article>
			</main>
		);
	}

	const standardResearchTopics = [
		{ key: "mil", label: "Military Strength", data: research.mil },
		{ key: "money", label: "Money", data: research.money },
		{ key: "pop", label: "Population Bonus", data: research.pop },
		{ key: "power", label: "Power Bonus", data: research.power },
		{ key: "warp", label: "Warp Drive", data: research.warp },
		{ key: "fdc", label: "Frequency Decryption", data: research.fdc },
	] as const;

	const techTopics = [
		{ key: "dr", label: "Dragoons", data: research.dr },
		{ key: "ft", label: "Fighters", data: research.ft },
		{ key: "tf", label: "Air Supremacy Beacon", data: research.tf },
		{ key: "ld", label: "Laser Dragoons", data: research.ld },
		{ key: "lf", label: "Laser Fighters", data: research.lf },
		{ key: "ht", label: "Hover Tanks", data: research.ht },
		{ key: "fusion", label: "Fusion Technology", data: research.fusion },
		{ key: "core", label: "Energy Core", data: research.core },
		{ key: "armor", label: "Probe Armor", data: research.armor },
	] as const;

	const techTree = GAME_PARAMS.militaryTechTree;

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAssignQueue((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const requestSum = Object.values(assignQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const handleMaxClick = (key: string) => {
		const techInfo = techTree[key as keyof typeof techTree];
		let required = 0;
		if (techInfo) {
			required = techInfo.requirePoints;
		} else {
			required = GAME_PARAMS.research.required(
				key as keyof typeof GAME_PARAMS.research.weights,
				myKingdom.land,
			);
		}

		const currentPts =
			(myKingdom.research as Record<string, ResearchDisc | undefined>)[key]
				?.pts || 0;
		const needed = Math.max(0, required - currentPts);

		if (needed <= 0) return;

		setAssignQueue((prev) => {
			const otherPoints = Object.entries(prev).reduce(
				(sum, [k, val]) => (k !== key ? sum + (parseInt(val, 10) || 0) : sum),
				0,
			);

			// If we have enough points to satisfy 'needed' plus whatever is typed in others
			if (myKingdom.researchPts >= needed + otherPoints) {
				return { ...prev, [key]: Math.floor(needed).toString() };
			}

			// Not enough points for everything: clear others and prioritize this discipline
			const assignable = Math.min(myKingdom.researchPts, needed);
			return {
				pop: "",
				power: "",
				mil: "",
				money: "",
				fdc: "",
				warp: "",
				dr: "",
				ft: "",
				tf: "",
				ld: "",
				lf: "",
				hgl: "",
				ht: "",
				fusion: "",
				core: "",
				armor: "",
				[key]: assignable.toString(),
			};
		});
	};

	const handleAutoToggle = async (key: string) => {
		const currentAuto = myKingdom.researchAutoAssign || [];
		let newPriority = [...currentAuto];
		if (newPriority.includes(key)) {
			newPriority = newPriority.filter((k) => k !== key);
		} else {
			newPriority.push(key);
		}
		try {
			await saveAutoAssign({ priority: newPriority });
		} catch (error) {
			console.error(error);
			showMessage("Failed to update auto-assign priority.", "error");
		}
	};

	const handleAssign = async (e: React.FormEvent) => {
		e.preventDefault();

		if (requestSum > myKingdom.researchPts) {
			showMessage("Not enough research points available!", "error");
			return;
		}
		if (requestSum <= 0) {
			showMessage("Please allocate at least some points.", "warning");
			return;
		}

		setIsAssigning(true);
		try {
			await assignPoints({
				pop: parseInt(assignQueue.pop, 10) || 0,
				power: parseInt(assignQueue.power, 10) || 0,
				mil: parseInt(assignQueue.mil, 10) || 0,
				money: parseInt(assignQueue.money, 10) || 0,
				fdc: parseInt(assignQueue.fdc, 10) || 0,
				warp: parseInt(assignQueue.warp, 10) || 0,
				dr: parseInt(assignQueue.dr, 10) || 0,
				ft: parseInt(assignQueue.ft, 10) || 0,
				tf: parseInt(assignQueue.tf, 10) || 0,
				ld: parseInt(assignQueue.ld, 10) || 0,
				lf: parseInt(assignQueue.lf, 10) || 0,
				f74: 0,
				hgl: 0,
				ht: parseInt(assignQueue.ht, 10) || 0,
				fusion: parseInt(assignQueue.fusion, 10) || 0,
				core: parseInt(assignQueue.core, 10) || 0,
				armor: parseInt(assignQueue.armor, 10) || 0,
			});
			setAssignQueue({
				pop: "",
				power: "",
				mil: "",
				money: "",
				fdc: "",
				warp: "",
				dr: "",
				ft: "",
				tf: "",
				ld: "",
				lf: "",
				hgl: "",
				ht: "",
				fusion: "",
				core: "",
				armor: "",
			});
			showMessage("Research points successfully assigned!", "success");
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Failed to assign points.",
				"error",
			);
		} finally {
			setIsAssigning(false);
		}
	};

	const handleHireScientists = async (e: React.FormEvent) => {
		e.preventDefault();
		const amount = parseInt(hireAmount, 10);
		if (Number.isNaN(amount) || amount <= 0) {
			showMessage("Please enter a valid amount of scientists.", "warning");
			return;
		}

		if (myKingdom.money < amount * 1000) {
			showMessage("Not enough money to buy scientists.", "error");
			return;
		}
		if (myKingdom.military.sol < amount) {
			showMessage("Not enough soldiers to convert to scientists.", "error");
			return;
		}

		setIsHiring(true);
		try {
			await hireScientists({ amount });
			setHireAmount("");
			showMessage(
				`Successfully hired ${amount.toLocaleString()} scientists!`,
				"success",
			);
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Failed to hire scientists.",
				"error",
			);
		} finally {
			setIsHiring(false);
		}
	};

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Research</h2>
						<p>Current research topics and progress</p>
					</hgroup>
				</header>

				<article style={{ marginBottom: "2rem" }}>
					<form
						onSubmit={handleHireScientists}
						className="grid"
						style={{ alignItems: "center", marginBottom: 0 }}
					>
						<div>
							<hgroup style={{ marginBottom: 0 }}>
								<h6 style={{ marginBottom: 0 }}>Hire Scientists</h6>
								<small style={{ fontSize: "0.75rem" }}>
									{GAME_PARAMS.military.units.sci.sol} sol + $
									{GAME_PARAMS.military.units.sci.cost.toLocaleString()} = 1 sci
									(1 pt/tick)
								</small>
							</hgroup>
						</div>
						<div style={{ textAlign: "center" }}>
							{(() => {
								const autoAssign = myKingdom.researchAutoAssign || [];
								const sumWeights = autoAssign.reduce((sum, key) => {
									const weight =
										(GAME_PARAMS.research.weights as Record<string, number>)[
											key
										] || 0;
									return sum + weight;
								}, 0);
								const scientists = myKingdom.military.sci;
								const pointsFor1PercLand =
									(myKingdom.land * 1.01) ** 2 * sumWeights -
									myKingdom.land ** 2 * sumWeights;
								const landCoverage =
									(scientists / pointsFor1PercLand) * myKingdom.land * 0.01;

								return (
									<>
										<h6 style={{ marginBottom: 0 }}>
											Scientists: {scientists.toLocaleString()}
										</h6>
										<small
											style={{
												color: "var(--pico-muted-color)",
												fontSize: "0.85rem",
											}}
										>
											{sumWeights > 0 ? (
												<div>
													Covers up to{" "}
													<strong>
														{Math.floor(landCoverage).toLocaleString()}
													</strong>{" "}
													land / tick
												</div>
											) : (
												"No auto-priority topics selected"
											)}
										</small>
									</>
								);
							})()}
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								alignItems: "center",
								justifyContent: "flex-end",
							}}
						>
							<button
								type="button"
								className="secondary outline"
								style={{
									padding: "0.4rem 0.8rem",
									width: "auto",
									fontSize: "0.9rem",
									marginBottom: 0,
								}}
								disabled={isHiring}
								onClick={() => {
									const maxByMoney = Math.floor(myKingdom.money / 1000);
									const maxBySoldiers = myKingdom.military.sol;
									const rawMax = Math.min(maxByMoney, maxBySoldiers);
									const duration = GAME_PARAMS.military.duration;
									const cleanMax = Math.floor(rawMax / duration) * duration;
									setHireAmount(cleanMax.toString());
								}}
							>
								Max
							</button>
							<input
								type="number"
								value={hireAmount}
								onChange={(e) => setHireAmount(e.target.value)}
								min="0"
								placeholder="Amount"
								style={{
									marginBottom: 0,
									maxWidth: "150px",
									fontSize: "1rem",
								}}
							/>
							<button
								type="submit"
								className="outline"
								disabled={
									isHiring || !hireAmount || parseInt(hireAmount, 10) <= 0
								}
								style={{
									width: "auto",
									marginBottom: 0,
									padding: "0.4rem 1rem",
									fontSize: "1rem",
								}}
							>
								{isHiring ? "..." : "Hire"}
							</button>
						</div>
					</form>
				</article>

				<form onSubmit={handleAssign}>
					<p>
						<strong>Available Research Points:</strong>{" "}
						<span
							style={{
								color:
									requestSum > myKingdom.researchPts
										? "var(--pico-del-color)"
										: "inherit",
							}}
						>
							{(myKingdom.researchPts - requestSum).toLocaleString()}
						</span>{" "}
						| <strong>Points Produced:</strong>{" "}
						{myKingdom.military.sci.toLocaleString()} / tick
					</p>
					<p>
						As your kingdom grows, you have to spend more research points to
						keep up
					</p>
					<hgroup>
						<h4>Standard Research</h4>
						<p>Land based scaling research topics</p>
					</hgroup>
					<figure>
						<table className="striped">
							<thead>
								<tr>
									<th scope="col">Research Area</th>
									<th scope="col">Bonus (%)</th>
									<th scope="col">Points Balance</th>
									<th scope="col" style={{ textAlign: "center" }}>
										Auto / Priority
									</th>
									<th scope="col">Max</th>
									<th scope="col">Assign</th>
								</tr>
							</thead>
							<tbody>
								{standardResearchTopics.map(({ key, label, data }) => {
									const prerequisiteKey = (
										GAME_PARAMS.researchPrerequisites as Record<string, string>
									)[key];
									const prerequisiteMet = prerequisiteKey
										? ((
												myKingdom.research as Record<
													string,
													ResearchDisc | undefined
												>
											)[prerequisiteKey]?.perc ?? 0) >= 100
										: true;

									return (
										<tr
											key={key}
											style={{ opacity: prerequisiteMet ? 1 : 0.5 }}
										>
											<td>
												{label}
												{!prerequisiteMet && (
													<div style={{ fontSize: "0.75rem", color: "red" }}>
														Locked: Needs{" "}
														{techTopics.find((t) => t.key === prerequisiteKey)
															?.label || prerequisiteKey}
													</div>
												)}
												{(data?.perc ?? 0) >= 100 && (
													<div style={{ fontSize: "0.75rem", color: "var(--pico-ins-color)" }}>
														Completed
													</div>
												)}
											</td>
											<td>{data?.perc ?? 0}%</td>
											<td>
												{(() => {
													const required = GAME_PARAMS.research.required(
														key,
														myKingdom.land,
													);
													const current = data?.pts ?? 0;
													const delta = current - required;
													const isSurplus = delta >= 0;
													return (
														<span>
															<small
																style={{
																	color: isSurplus
																		? "var(--pico-ins-color)"
																		: "var(--pico-del-color)",
																}}
															>
																{isSurplus ? "+" : ""}
																{delta.toLocaleString()}
															</small>
														</span>
													);
												})()}
											</td>
											<td align="center">
												<div
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														gap: "0.5rem",
													}}
												>
													<input
														type="checkbox"
														checked={(
															myKingdom.researchAutoAssign || []
														).includes(key)}
														onChange={() => handleAutoToggle(key)}
														style={{ margin: 0 }}
														disabled={!prerequisiteMet}
													/>
													{(() => {
														const index = (
															myKingdom.researchAutoAssign || []
														).indexOf(key);
														return index !== -1 ? (
															<span style={{ fontWeight: "bold" }}>
																#{index + 1}
															</span>
														) : null;
													})()}
												</div>
											</td>
											<td>
												<MaxButton
													onClick={() => handleMaxClick(key)}
													disabled={
														isAssigning ||
														myKingdom.researchPts <= 0 ||
														!prerequisiteMet
													}
												/>
											</td>
											<td>
												<input
													type="number"
													name={key}
													value={assignQueue[key as keyof typeof assignQueue]}
													onChange={handleInputChange}
													min="0"
													disabled={isAssigning}
													style={{ minWidth: "100px", marginBottom: 0 }}
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
							textAlign: "right",
							marginBottom: "1.5rem",
							marginTop: "-0.5rem",
						}}
					>
						<button
							type="submit"
							disabled={
								isAssigning ||
								requestSum > myKingdom.researchPts ||
								requestSum <= 0
							}
							style={{ width: "auto" }}
						>
							{isAssigning ? "Assigning..." : "Assign Points"}
						</button>
					</div>

					<hgroup
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div>
							<h4>Technical Research</h4>
							<p>Fixed required points for advanced technology</p>
						</div>
						<div
							style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}
						>
							<label
								htmlFor="showAllTech"
								style={{
									marginBottom: 0,
									fontSize: "0.85rem",
									color: "var(--pico-muted-color)",
								}}
							>
								Show all tech
							</label>
							<input
								type="checkbox"
								id="showAllTech"
								name="showAllTech"
								role="switch"
								aria-checked={showAllTech}
								checked={showAllTech}
								onChange={(e) => setShowAllTech(e.target.checked)}
								style={{ margin: 0 }}
							/>
						</div>
					</hgroup>

					{(() => {
						const allTechDone = techTopics.every(
							(t) => (t.data?.perc ?? 0) >= 100,
						);

						if (allTechDone && !showAllTech) {
							return (
								<article
									style={{
										textAlign: "center",
										padding: "2rem",
										backgroundColor: "rgba(0, 255, 100, 0.05)",
										border: "1px dashed var(--pico-ins-color)",
									}}
								>
									<h5
										style={{ color: "var(--pico-ins-color)", marginBottom: 0 }}
									>
										🌟 All Technical Research Completed! 🌟
									</h5>
									<p style={{ marginBottom: 0, opacity: 0.8 }}>
										Your scientists have unlocked every possible technological
										breakthrough. Focus your points on scaling standard
										research.
									</p>
								</article>
							);
						}

						return (
							<>
								<figure>
									<table className="striped">
										<thead>
											<tr>
												<th scope="col">Technology</th>
												<th scope="col">Progress</th>
												<th scope="col">Requires</th>
												<th scope="col">Auto / Priority</th>
												<th scope="col">Max</th>
												<th scope="col">Assign</th>
											</tr>
										</thead>
										<tbody>
											{techTopics
												.filter(({ key, data }) => {
													if (showAllTech) return true;

													// Hide completed research
													if ((data?.perc ?? 0) >= 100) return false;

													// Hide locked research
													const techInfo =
														techTree[key as keyof typeof techTree];
													if (!techInfo) return true;

													const prerequisite = techInfo?.requires;
													if (!prerequisite) return true;

													return (
														((
															myKingdom.research as Record<string, ResearchDisc>
														)[prerequisite]?.perc ?? 0) >= 100
													);
												})
												.map(({ key, label, data }) => {
													const techInfo =
														techTree[key as keyof typeof techTree];
													const prerequisite = techInfo?.requires;
													const prerequisiteMet = prerequisite
														? ((
																myKingdom.research as Record<
																	string,
																	ResearchDisc
																>
															)[prerequisite]?.perc ?? 0) >= 100
														: true;

													return (
														<tr
															key={key}
															style={{ opacity: prerequisiteMet ? 1 : 0.5 }}
														>
															<td>
																<div
																	style={{
																		display: "flex",
																		alignItems: "center",
																		gap: "0.5rem",
																	}}
																>
																	{label}
																	{(() => {
																		const unitStats =
																			GAME_PARAMS.military.units[
																				key as keyof typeof GAME_PARAMS.military.units
																			];
																		if (unitStats) {
																			const tcDiscount =
																				GAME_PARAMS.military.calculateTcDiscount(
																					myKingdom.buildings.tc || 0,
																					myKingdom.land,
																				);
																			const discountedCost = Math.floor(
																				(unitStats.cost * (100 - tcDiscount)) /
																					100,
																			);
																			const solCost = (
																				unitStats as typeof GAME_PARAMS.military.units.tr
																			).sol;
																			let tooltipContent = `Unlocks ${label}: ⚔️ ${unitStats?.off} | 🛡️ ${unitStats?.def} points`;
																			if (key === "tf") {
																				tooltipContent =
																					"Unlocks Air Support Bays (building) and mechanical units (TFs, F74 Drones)";
																			} else {
																				// Append cost info as well for more detail
																				tooltipContent += ` | Cost: $${discountedCost.toLocaleString()}${
																					solCost > 0 ? ` | Soldiers: ${solCost}` : ""
																				}`;
																			}
																			return (
																				<Tooltip
																					content={tooltipContent}
																					position="right"
																					showIcon
																				/>
																			);
																		}

																		const techInfo =
																			GAME_PARAMS.militaryTechTree[
																				key as keyof typeof GAME_PARAMS.militaryTechTree
																			];
																		if (techInfo?.bonus) {
																			let content = `Unlocks ${techInfo.bonus}% better power plants`;
																			if (key === "core")
																				content += " and Warp Drive";
																			return (
																				<Tooltip
																					content={content}
																					position="right"
																					showIcon
																				/>
																			);
																		}

																		return null;
																	})()}
																</div>
																{!prerequisiteMet && (
																	<div style={{ fontSize: "0.75rem", color: "red" }}>
																		Locked: Needs{" "}
																		{techTopics.find((t) => t.key === prerequisite)
																			?.label || prerequisite}
																	</div>
																)}
																{(data?.perc ?? 0) >= 100 && (
																	<div style={{ fontSize: "0.75rem", color: "var(--pico-ins-color)" }}>
																		Completed
																	</div>
																)}
															</td>
															<td>
																<progress
																	value={data?.perc ?? 0}
																	max="100"
																	style={{ marginBottom: 0 }}
																></progress>
																<small>{data?.perc ?? 0}%</small>
															</td>
															<td>
																<small>
																	{(data?.pts ?? 0).toLocaleString()} /{" "}
																	{(
																		techInfo?.requirePoints ?? 0
																	).toLocaleString()}
																</small>
															</td>
															<td align="center">
																<div
																	style={{
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "center",
																		gap: "0.5rem",
																	}}
																>
																	<input
																		type="checkbox"
																		checked={(
																			myKingdom.researchAutoAssign || []
																		).includes(key)}
																		onChange={() => handleAutoToggle(key)}
																		style={{ margin: 0 }}
																		disabled={!prerequisiteMet}
																	/>
																	{(() => {
																		const index = (
																			myKingdom.researchAutoAssign || []
																		).indexOf(key);
																		return index !== -1 ? (
																			<span style={{ fontWeight: "bold" }}>
																				#{index + 1}
																			</span>
																		) : null;
																	})()}
																</div>
															</td>
															<td>
																<MaxButton
																	onClick={() => handleMaxClick(key)}
																	disabled={
																		isAssigning ||
																		myKingdom.researchPts <= 0 ||
																		!prerequisiteMet ||
																		(data?.perc ?? 0) >= 100
																	}
																	label={
																		(data?.perc ?? 0) >= 100 ? "Done" : "Max"
																	}
																/>
															</td>
															<td>
																<input
																	type="number"
																	name={key}
																	value={
																		assignQueue[key as keyof typeof assignQueue]
																	}
																	onChange={handleInputChange}
																	min="0"
																	disabled={
																		isAssigning ||
																		!prerequisiteMet ||
																		(data?.perc ?? 0) >= 100
																	}
																	style={{ minWidth: "100px", marginBottom: 0 }}
																	placeholder={
																		!prerequisiteMet
																			? "Locked"
																			: (data?.perc ?? 0) >= 100
																				? "Done"
																				: "0"
																	}
																/>
															</td>
														</tr>
													);
												})}
										</tbody>
									</table>
								</figure>

								<footer>
									<div style={{ textAlign: "right" }}>
										<button
											type="submit"
											disabled={
												isAssigning ||
												requestSum > myKingdom.researchPts ||
												requestSum <= 0
											}
											style={{ width: "auto" }}
										>
											{isAssigning ? "Assigning..." : "Assign Points"}
										</button>
									</div>
								</footer>
							</>
						);
					})()}
				</form>
			</article>
		</main>
	);
}
