import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/kingdom")({
	component: KingdomLayout,
});

function KingdomLayout() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const gameStatus = useQuery(api.game.getGameStatus);

	return (
		<div>
			{myKingdom && (
				<header className="container" style={{ margin: "2rem auto" }}>
					<nav>
						<ul>
							<li>
								<strong>{myKingdom.kdName}</strong>
							</li>
						</ul>
						<ul>
							{gameStatus && (
								<li
									style={{
										marginRight: "1rem",
										color: "var(--pico-muted-color)",
									}}
								>
									Rnd: {gameStatus.roundNumber} | Tick: {gameStatus.currentTick}
									/{gameStatus.endTick}
								</li>
							)}
							<li>Land: {myKingdom.land.toLocaleString()}</li>
							<li>Pop: {myKingdom.population.toLocaleString()}</li>
							<li>Money: ${myKingdom.money.toLocaleString()}</li>
						</ul>
					</nav>
					<nav>
						<ul>
							<li>
								<Link to="/kingdom/status">Status</Link>
							</li>
							<li>
								<Link to="/kingdom/buildings">Buildings</Link>
							</li>
							<li>
								<Link to="/kingdom/delete" className="contrast">
									Delete Kingdom
								</Link>
							</li>
						</ul>
						<ul>
							<li>
								<Link to="/auth/signout" className="secondary">
									Sign out
								</Link>
							</li>
						</ul>
					</nav>
					<hr />
				</header>
			)}
			<Outlet />
		</div>
	);
}
