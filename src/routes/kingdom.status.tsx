import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
						<thead>
							<tr>
								<th scope="col">Resource</th>
								<th scope="col">Amount</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Population</td>
								<td>{myKingdom.population.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Land</td>
								<td>{myKingdom.land.toLocaleString()} acres</td>
							</tr>
							<tr>
								<td>Money</td>
								<td>${myKingdom.money.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Scientists</td>
								<td>{myKingdom.scientists.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Soldiers</td>
								<td>{myKingdom.soldiers.toLocaleString()}</td>
							</tr>
						</tbody>
					</table>
				</figure>
			</article>
		</main>
	);
}
