import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GAME_PARAMS } from "../constants/game-params";

export const Route = createFileRoute("/kingdom/status")({
	component: KingdomStatusPage,
});

function KingdomStatusPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/kingdom/create" });
		return null;
	}

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
	const raxCapacity =
		myKingdom.buildings.rax * GAME_PARAMS.buildings.raxCapacity;
	const raxRatio = raxCapacity > 0 ? (raxUsage / raxCapacity) * 100 : 0;

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName}</h2>
						<p>Ruled by {myKingdom.rulerName}</p>
					</hgroup>
				</header>
				<div className="grid">
					<div>
						<strong>Planet Type:</strong> {myKingdom.planetType}
					</div>
					<div>
						<strong>Race Type:</strong> {myKingdom.raceType}
					</div>
				</div>
				<hr />
				<figure>
					<table>
						<tbody>
							<tr>
								<td>Population</td>
								<td>
									{myKingdom.population.toLocaleString()} (
									{myKingdom.popChange > 0
										? `+${myKingdom.popChange}`
										: myKingdom.popChange}
									)
								</td>
							</tr>
							<tr>
								<td>Net Income</td>
								<td>${myKingdom.moneyIncome.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Net Power</td>
								<td>{myKingdom.powerIncome.toLocaleString()}</td>
							</tr>

							<tr>
								<td>Scientists</td>
								<td>{myKingdom.military.sci.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Soldiers</td>
								<td>{myKingdom.military.sol.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Probes</td>
								<td>{myKingdom.probes.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Barracks Usage</td>
								<td>
									{raxUsage.toLocaleString()} / {raxCapacity.toLocaleString()} (
									{raxRatio.toFixed(1)}%)
								</td>
							</tr>
						</tbody>
					</table>
				</figure>
			</article>
		</main>
	);
}
