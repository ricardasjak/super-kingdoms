import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../../src/constants/game-params";
import { useKingdomMessage } from "../../src/contexts/KingdomMessageContext";

export const Route = createFileRoute("/kingdom/research")({
	component: KingdomResearchPage,
});

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
	});
	const [isAssigning, setIsAssigning] = useState(false);
	const [hireAmount, setHireAmount] = useState("");
	const [isHiring, setIsHiring] = useState(false);

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

	const researchTopics = [
		{ key: "pop", label: "Population Bonus", data: research.pop },
		{ key: "power", label: "Power Bonus", data: research.power },
		{ key: "mil", label: "Military Strength", data: research.mil },
		{ key: "money", label: "Money", data: research.money },
		{ key: "fdc", label: "Frequency Decryption", data: research.fdc },
		{ key: "warp", label: "Warp Drive", data: research.warp },
	] as const;

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
		const required = GAME_PARAMS.research.required(
			key as keyof typeof GAME_PARAMS.research.weights,
			myKingdom.land,
		);
		const currentPts =
			myKingdom.research[key as keyof typeof myKingdom.research]?.pts || 0;
		const needed = Math.max(0, required - currentPts);

		if (needed <= 0) return;

		setAssignQueue((prev) => {
			const otherPoints = Object.entries(prev).reduce(
				(sum, [k, val]) => (k !== key ? sum + (parseInt(val, 10) || 0) : sum),
				0,
			);

			// If we have enough points to satisfy 'needed' plus whatever is typed in others
			if (myKingdom.researchPts >= needed + otherPoints) {
				return { ...prev, [key]: needed.toString() };
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
			});
			setAssignQueue({
				pop: "",
				power: "",
				mil: "",
				money: "",
				fdc: "",
				warp: "",
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
									1 sol + $1.000 = 1 sci (1 pt/tick)
								</small>
							</hgroup>
						</div>
						<div style={{ textAlign: "center" }}>
							<small
								style={{
									color: "var(--pico-muted-color)",
									fontSize: "0.85rem",
								}}
							>
								Soldiers:{" "}
								<strong>{myKingdom.military.sol.toLocaleString()}</strong> |{" "}
								Money: <strong>${myKingdom.money.toLocaleString()}</strong> |{" "}
								Scientists:{" "}
								<strong>{myKingdom.military.sci.toLocaleString()}</strong>
							</small>
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
								{researchTopics.map(({ key, label, data }) => (
									<tr key={key}>
										<td>{label}</td>
										<td>{data.perc}%</td>
										<td>
											{(() => {
												const required = GAME_PARAMS.research.required(
													key,
													myKingdom.land,
												);
												const current = data.pts;
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
										<td style={{ textAlign: "center" }}>
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
											<button
												type="button"
												onClick={() => handleMaxClick(key)}
												disabled={isAssigning || myKingdom.researchPts <= 0}
												style={{
													padding: "0.25rem 0.5rem",
													fontSize: "0.875rem",
													cursor:
														isAssigning || myKingdom.researchPts <= 0
															? "not-allowed"
															: "pointer",
												}}
											>
												Max
											</button>
										</td>
										<td>
											<input
												type="number"
												name={key}
												value={assignQueue[key as keyof typeof assignQueue]}
												onChange={handleInputChange}
												min="0"
												disabled={isAssigning}
												style={{ minWidth: "120px" }}
											/>
										</td>
									</tr>
								))}
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
							>
								{isAssigning ? "Assigning..." : "Assign Points"}
							</button>
						</div>
					</footer>
				</form>
			</article>
		</main>
	);
}
