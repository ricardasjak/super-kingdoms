import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PlayButton } from "../components/play-button";
import {
	KingdomMessageProvider,
	useKingdomMessage,
} from "../contexts/KingdomMessageContext";
export const Route = createFileRoute("/kingdom")({
	component: KingdomLayout,
});

function KingdomLayoutContent() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const gameStatus = useQuery(api.game.getGameStatus);
	const { message, messageType } = useKingdomMessage();

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/" });
		return null;
	}

	if (myKingdom.state === "dead") {
		return (
			<div className="container" style={{ textAlign: "center", marginTop: "5rem" }}>
				<article style={{ borderColor: "var(--pico-del-color)" }}>
					<header style={{ backgroundColor: "var(--pico-del-color)", color: "white" }}>
						<h2 style={{ margin: 0 }}>OFFICIAL NOTICE</h2>
					</header>
					<h1 style={{ color: "var(--pico-del-color)", fontSize: "3rem", margin: "2rem 0" }}>
						YOUR KINGDOM HAS FALLEN
					</h1>
					<p style={{ fontSize: "1.2rem" }}>
						The population of <strong>{myKingdom.kdName}</strong> has been completely eradicated.
						A kingdom cannot exist without its people.
					</p>
					<footer style={{ marginTop: "2rem" }}>
						<button
							type="button"
							onClick={() => navigate({ to: "/kingdom/delete" })}
							className="secondary"
						>
							Release Land & Start Over
						</button>
					</footer>
				</article>
			</div>
		);
	}

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
							<li>
								Land: {myKingdom.land.toLocaleString()} (
								{myKingdom.nw.toLocaleString()} NW)
							</li>
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
								<Link to="/kingdom/growth">Growth</Link>
							</li>
							<li>
								<Link to="/kingdom/military">Military</Link>
							</li>
							<li>
								<Link to="/kingdom/research">Research</Link>
							</li>
							<li>
								<Link to="/kingdom/reports">Reports</Link>
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
								<Link to="/kingdom/profile">Profile</Link>
							</li>
						</ul>
					</nav>
					<hr />
					{message && (
						<div
							style={{
								position: "fixed",
								top: "1rem",
								left: "50%",
								transform: "translateX(-50%)",
								zIndex: 1000,
								minWidth: "350px",
								maxWidth: "500px",
								padding: "0.75rem 1rem",
								backgroundColor: "var(--pico-background-color)",
								color:
									messageType === "error"
										? "var(--pico-del-color)"
										: messageType === "warning"
											? "#d97706"
											: "var(--pico-ins-color)",
								border: `1px solid ${
									messageType === "error"
										? "var(--pico-del-color)"
										: messageType === "warning"
											? "#d97706"
											: "var(--pico-ins-color)"
								}`,
								borderRadius: "6px",
								boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
						>
							<div>
								<strong>
									{messageType === "error"
										? "Error"
										: messageType === "warning"
											? "Warning"
											: "Success"}
									: &nbsp;
								</strong>
								<span>{message}</span>
							</div>
						</div>
					)}
				</header>
			)}
			<Outlet />
		</div>
	);
}

function KingdomLayout() {
	return (
		<KingdomMessageProvider>
			<KingdomLayoutContent />
		</KingdomMessageProvider>
	);
}
