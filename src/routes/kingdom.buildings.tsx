import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/kingdom/buildings")({
	component: KingdomBuildingsPage,
});

function KingdomBuildingsPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const buildings = useQuery(api.kingdoms.getKingdomBuildings);

	if (myKingdom === undefined || buildings === undefined) {
		return (
			<main className="container">
				<article aria-busy="true">Loading kingdom buildings...</article>
			</main>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/kingdom/create" });
		return null;
	}

	if (buildings === null) {
		return (
			<main className="container">
				<article>
					<header>Error</header>
					<p>Could not locate buildings data for your kingdom.</p>
				</article>
			</main>
		);
	}

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName} Buildings</h2>
						<p>Current structures and facilities</p>
					</hgroup>
				</header>

				<figure>
					<table className="striped">
						<thead>
							<tr>
								<th scope="col">Building Type</th>
								<th scope="col">Count</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Residences</td>
								<td>{buildings.res}</td>
							</tr>
							<tr>
								<td>Star Mines</td>
								<td>{buildings.sm}</td>
							</tr>
							<tr>
								<td>Power Plants</td>
								<td>{buildings.plants}</td>
							</tr>
							<tr>
								<td>Barracks</td>
								<td>{buildings.rax}</td>
							</tr>
							<tr>
								<td>Probe Factories</td>
								<td>{buildings.pf}</td>
							</tr>
							<tr>
								<td>Training Camps</td>
								<td>{buildings.tc}</td>
							</tr>
							<tr>
								<td>Air Support Bays</td>
								<td>{buildings.asb}</td>
							</tr>
							<tr>
								<td>Aegis Control Hubs</td>
								<td>{buildings.ach}</td>
							</tr>
							<tr>
								<td>Rubble</td>
								<td>{buildings.rubble}</td>
							</tr>
						</tbody>
					</table>
				</figure>

				<footer>
					<div className="grid">
						<Link
							to="/kingdom/status"
							role="button"
							className="secondary outline"
						>
							Back to Status
						</Link>
					</div>
				</footer>
			</article>
		</main>
	);
}
