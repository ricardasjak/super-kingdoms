import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../../src/constants/game-params";
import { useKingdomMessage } from "../../src/contexts/KingdomMessageContext";

import { RESEARCH_TOOLTIPS } from "../components/research/ResearchTooltips";
import { ScientistsSummary } from "../components/research/ScientistsSummary";
import { TechnicalResearchTree } from "../components/research/TechnicalResearchTree";
import type { ResearchData, ResearchTechType } from "../types/game";

export const Route = createFileRoute("/kingdom/research")({
	component: KingdomResearchPage,
});

function KingdomResearchPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const saveAutoAssign = useMutation(api.kingdoms.saveResearchAutoAssign);
	const hireScientists = useMutation(api.kingdoms.buyScientists);
	const { showMessage } = useKingdomMessage();

	const [hireAmount, setHireAmount] = useState("");
	const [isHiring, setIsHiring] = useState(false);
	const [showAllTech, setShowAllTech] = useState(false);

	if (myKingdom === undefined) {
		return (
			<section>
				<article aria-busy="true">Loading kingdom...</article>
			</section>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/create" });
		return null;
	}

	const { research } = myKingdom;

	if (!research) {
		return (
			<section>
				<article>
					<header>Error</header>
					<p>Could not locate research data for your kingdom.</p>
				</article>
			</section>
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

	const techTopics: Array<{
		key: ResearchTechType;
		label: string;
		data: ResearchData | undefined;
	}> = [
		{ key: "r_fusion", label: "Fusion Technology", data: research.r_fusion },
		{ key: "r_core", label: "Energy Core", data: research.r_core },
		{ key: "r_armor", label: "Probe Armor", data: research.r_armor },

		{ key: "r_long", label: "Longevity", data: research.r_long },
		{ key: "r_dr", label: "Dragoons", data: research.r_dr },
		{ key: "r_ft", label: "Fighters", data: research.r_ft },
		{ key: "r_ld", label: "Laser Dragoons", data: research.r_ld },
		{ key: "r_lf", label: "Laser Fighters", data: research.r_lf },

		{ key: "r_f74", label: "Air Supremacy Beacon", data: research.r_f74 },
		{ key: "r_tf", label: "Air Supremacy Beacon II", data: research.r_tf },
		{ key: "r_ht", label: "Hover Tanks", data: research.r_ht },
	];

	const handleAutoToggle = async (key: string) => {
		const currentAuto = myKingdom.researchAutoAssign || [];
		let newPriority = [...currentAuto];
		if (newPriority.includes(key)) {
			newPriority = newPriority.filter((k) => k !== key);
		} else {
			const standardKeys = ["pop", "power", "mil", "money", "fdc", "warp"];
			const isStandard = standardKeys.includes(key);

			if (isStandard) {
				const firstTechIndex = newPriority.findIndex(
					(k) => !standardKeys.includes(k),
				);
				if (firstTechIndex === -1) {
					newPriority.push(key);
				} else {
					newPriority.splice(firstTechIndex, 0, key);
				}
			} else {
				newPriority.push(key);
			}
		}
		try {
			await saveAutoAssign({ priority: newPriority });
		} catch (error) {
			console.error(error);
			showMessage("Failed to update auto-assign priority.", "error");
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
		<section>
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
						<ScientistsSummary myKingdom={myKingdom} />
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

				<div style={{ marginBottom: "1rem" }}>
					<p style={{ margin: 0 }}>
						<strong>Points Produced:</strong> {myKingdom.military.sci.toLocaleString()} / tick
					</p>
					{myKingdom.researchPts > 0 && (
						<p style={{ fontSize: "0.8rem", color: "var(--pico-muted-color)", margin: 0 }}>
							Spare points collected: {myKingdom.researchPts.toLocaleString()}
						</p>
					)}
				</div>
				<p>
					As your kingdom grows, you have to spend more research points to keep
					up
				</p>
				<hgroup>
					<h4>Standard Research</h4>
					<p>Land based scaling research topics</p>
				</hgroup>

				<div
					className="technical-research-list"
					style={{ marginTop: 0, marginBottom: "2rem" }}
				>
					{standardResearchTopics.map(({ key, label, data }) => {
						const prerequisiteKey = GAME_PARAMS.research.params[key].requires;
						const prerequisiteMet =
							!prerequisiteKey ||
							(myKingdom.research[prerequisiteKey]?.perc ?? 0) >= 100;

						const required = GAME_PARAMS.research.required(
							key as keyof typeof GAME_PARAMS.research.params,
							myKingdom.land,
						);
						const maxBonus =
							GAME_PARAMS.research.params[
								key as keyof typeof GAME_PARAMS.research.params
							].bonus;
						const currentPts = data?.pts ?? 0;
						const delta = currentPts - required;
						const isSurplus = delta >= 0;
						const isCompleted = currentPts >= required;
						const index = (myKingdom.researchAutoAssign || []).indexOf(key);
						const isAutoAssigning = index !== -1;

						return (
							<div key={key} className="tech-list-item">
								<div
									className={`tech-node-content ${isCompleted ? "completed" : ""} ${!prerequisiteMet ? "locked" : ""}`}
								>
									<div
										className={`tech-node-header ${isCompleted ? "completed" : ""}`}
									>
										<div className="tech-title-wrap">
											<strong style={{ fontSize: "0.85rem" }}>{label}</strong>
											{RESEARCH_TOOLTIPS[key]}
											{isAutoAssigning && (
												<span className="active-badge">
													#{index + 1} Active
												</span>
											)}
										</div>

										<div className="tech-node-progress-compact">
											<progress value={data?.perc ?? 0} max={maxBonus} />
											<span className="progress-text">
												{data?.perc ?? 0}% ({(data?.pts ?? 0).toLocaleString()}{" "}
												/ {required.toLocaleString()} pts)
												<span
													style={{
														color: isSurplus
															? "var(--pico-ins-color)"
															: "var(--pico-del-color)",
														marginLeft: "0.5rem",
													}}
												>
													[{isSurplus ? "+" : ""}
													{delta.toLocaleString()}]
												</span>
											</span>
										</div>

										<div
											className="tech-node-actions"
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											{prerequisiteMet ? (
												<button
													type="button"
													className={`outline ${isAutoAssigning ? "secondary" : ""}`}
													onClick={() => handleAutoToggle(key)}
												>
													{isAutoAssigning ? "Stop" : "Start"}
												</button>
											) : (
												<span className="badge secondary">
													🔒 Locked (
													{techTopics.find((t) => t.key === prerequisiteKey)
														?.label || prerequisiteKey}
													)
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
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
					<div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
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
					const kd = myKingdom;
					if (!kd) return null;

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
								<h5 style={{ color: "var(--pico-ins-color)", marginBottom: 0 }}>
									🌟 All Technical Research Completed! 🌟
								</h5>
								<p style={{ marginBottom: 0, opacity: 0.8 }}>
									Your scientists have unlocked every possible technological
									breakthrough. Focus your points on scaling standard research.
								</p>
							</article>
						);
					}

					return (
						<TechnicalResearchTree
							myKingdom={kd}
							handleAutoToggle={handleAutoToggle}
							showAllTech={showAllTech}
						/>
					);
				})()}
			</article>
		</section>
	);
}
