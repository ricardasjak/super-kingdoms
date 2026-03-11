import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PlayButton } from "../components/play-button";
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
									R{gameStatus.roundNumber}, Tick {gameStatus.currentTick}/
									{gameStatus.endTick}
								</li>
							)}
							<li>Land: {myKingdom.land.toLocaleString()}</li>
							<li>Pop: {myKingdom.population.toLocaleString()}</li>
							<li>Power: {myKingdom.power.toLocaleString()}</li>
							<li>Money: ${myKingdom.money.toLocaleString()}</li>
						</ul>
					</nav>
					<nav>
						<ul>
							<li>
								<Link to="/kingdom/status">Status</Link>
							</li>
							<li>
								<Link to="/kingdom/explore">Explore</Link>
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
								<PlayButton
									showText={false}
									className="outline"
									style={{
										padding: "0.25rem 0.5rem",
										margin: 0,
										border: "none",
									}}
								/>
							</li>
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
