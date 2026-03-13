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

const ALL_UNIT_KEYS = [
	"sol",
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
	sol: "Sol",
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

function getUnitCost(key: string) {
	return UNITS[key as keyof typeof UNITS]?.cost || 0;
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
	const [isTraining, setIsTraining] = useState(false);
	const { showMessage } = useKingdomMessage();

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/kingdom/create" });
		return null;
	}

	if (!military) {
		return <p>Military not initialized</p>;
	}

	const totalNonSoldiers = ALL_UNIT_KEYS.reduce((sum, key) => {
		if (key === "sol") return sum;
		return sum + ((military[key as keyof typeof military] as number) || 0);
	}, 0);

	const actualPercent = (count: number) => {
		if (totalNonSoldiers === 0) return "0.0%";
		return `${((count / totalNonSoldiers) * 100).toFixed(1)}%`;
	};

	const requestSum = Object.values(trainQueue).reduce(
		(sum, val) => sum + (parseInt(val, 10) || 0),
		0,
	);

	const totalCost = UNIT_KEYS.reduce((sum, key) => {
		const count = parseInt(trainQueue[key], 10) || 0;
		return sum + count * getUnitCost(key);
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

		setIsTraining(true);
		try {
			await trainMilitary({
				sol: parseInt(trainQueue.sol, 10) || 0,
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

				<form onSubmit={handleTrain}>
					<figure>
						<table className="striped">
							<thead>
								<tr>
									<th scope="col">Unit Type</th>
									<th scope="col">Cost</th>
									<th scope="col">Actual %</th>
									<th scope="col">Count</th>
									<th scope="col">In Queue</th>
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
									return (
										<tr key={key}>
											<td>{UNIT_LABELS[key]}</td>
											<td>${getUnitCost(key)}</td>
											<td>{actualPercent(unitCount)}</td>
											<td>{unitCount}</td>
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
											<td>
												<input
													type="number"
													min="0"
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
