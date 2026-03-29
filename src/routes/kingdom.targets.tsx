import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/kingdom/targets")({
	component: TargetsPage,
});

function TargetsPage() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.kingdoms.searchKingdoms,
		{},
		{ initialNumItems: 50 },
	);

	return (
		<main className="container">
			<header>
				<hgroup>
					<h1>Targets</h1>
					<p>Explore the universe and find potential targets</p>
				</hgroup>
			</header>

			<section>
				<article>
					<div style={{ overflowX: "auto" }}>
						<table>
							<thead>
								<tr>
									<th>Kingdom Name</th>
									<th>Planet</th>
									<th>Race</th>
									<th style={{ textAlign: "right" }}>Land</th>
									<th style={{ textAlign: "right" }}>Networth</th>
								</tr>
							</thead>
							<tbody>
								{results.map((kd) => (
									<tr key={kd._id}>
										<td>
											<strong>{kd.kdName}</strong>
										</td>
										<td>{kd.planetType}</td>
										<td>{kd.raceType}</td>
										<td style={{ textAlign: "right" }}>
											{kd.land.toLocaleString()}
										</td>
										<td style={{ textAlign: "right" }}>
											{kd.nw.toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div style={{ marginTop: "2rem", textAlign: "center" }}>
						{status === "LoadingFirstPage" && (
							<p aria-busy="true">Loading kingdoms...</p>
						)}

						{status === "CanLoadMore" && (
							<button
								type="button"
								onClick={() => loadMore(50)}
								className="outline"
							>
								Load More
							</button>
						)}

						{status === "LoadingMore" && (
							<p aria-busy="true">Loading more kingdoms...</p>
						)}

						{status === "Exhausted" && results.length > 0 && (
							<p
								style={{
									textAlign: "center",
									color: "var(--pico-muted-color)",
									fontSize: "0.9rem",
								}}
							>
								— End of List —
							</p>
						)}

						{status === "Exhausted" && results.length === 0 && (
							<p>No kingdoms found in the universe yet.</p>
						)}
					</div>
				</article>
			</section>
		</main>
	);
}
