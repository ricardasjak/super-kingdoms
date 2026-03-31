import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { PlayButton } from "../components/play-button";
import {
	calculateLevel,
	calculateMaxDefPotential,
	calculateMaxOffPotential,
	calculateMinDefPotential,
	SpyReportSOK,
} from "../components/spy-report-sok";
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
	const releaseKingdom = useMutation(api.kingdoms.releaseKingdom);
	const gameStatus = useQuery(api.game.getGameStatus);
	const { message, messageType } = useKingdomMessage();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleQuickRelease = async () => {
		try {
			await releaseKingdom();
			navigate({ to: "/create" });
		} catch (error) {
			console.error("Failed to release kingdom", error);
		}
	};

	if (myKingdom === undefined) {
		return null;
	}

	if (!myKingdom) {
		navigate({ to: "/" });
		return null;
	}

	if (myKingdom.state === "dead") {
		return (
			<div
				className="container"
				style={{ textAlign: "center", marginTop: "5rem" }}
			>
				<article style={{ borderColor: "var(--pico-del-color)" }}>
					<header
						style={{ backgroundColor: "var(--pico-del-color)", color: "white" }}
					>
						<h2 style={{ margin: 0 }}>OFFICIAL NOTICE</h2>
					</header>
					<h1
						style={{
							color: "var(--pico-del-color)",
							fontSize: "3rem",
							margin: "2rem 0",
						}}
					>
						YOUR KINGDOM HAS FALLEN
					</h1>
					<p style={{ fontSize: "1.2rem" }}>
						The population of <strong>{myKingdom.kdName}</strong> has been
						completely eradicated. A kingdom cannot exist without its people.
					</p>
					<footer style={{ marginTop: "2rem" }}>
						<button
							type="button"
							onClick={handleQuickRelease}
							className="secondary"
						>
							Abdicate & Start Over
						</button>
					</footer>
				</article>
				<div style={{ textAlign: "left", maxWidth: "800px", margin: "0 auto" }}>
					<SpyReportSOK
						kdName={myKingdom.kdName}
						rulerName={myKingdom.rulerName}
						planetType={myKingdom.planetType}
						raceType={myKingdom.raceType}
						level={calculateLevel(myKingdom.land)}
						land={myKingdom.land}
						networth={myKingdom.nw}
						honor={0}
						money={myKingdom.money}
						population={myKingdom.population}
						power={myKingdom.power}
						probes={myKingdom.probes}
						scientists={myKingdom.military.sci || 0}
						maProtection={0}
						military={myKingdom.military}
						maxDefPotential={calculateMaxDefPotential(myKingdom.military)}
						maxOffPotential={calculateMaxOffPotential(myKingdom.military)}
						minDefPotential={calculateMinDefPotential(myKingdom.military)}
					/>
				</div>
			</div>
		);
	}

	return (
		<>
			{myKingdom && (
				<header className="kingdom-header">
					<nav className="top-stats-nav">
						<ul className="brand-container">
							<li>
								<strong className="kd-name-brand">{myKingdom.kdName}</strong>
							</li>
						</ul>
						<ul className="stats-list">
							{gameStatus && (
								<li className="game-tick-info">
									R{gameStatus.roundNumber}, T{gameStatus.currentTick}
								</li>
							)}
							<li className="desktop-only-stat" title="Money">
								$: {myKingdom.money.toLocaleString()}
							</li>
							<li title="Land and Networth">
								L: {myKingdom.land.toLocaleString()} (
								{Math.round(myKingdom.nw / 1000)}k)
							</li>
							<li
								className={
									myKingdom.popChange < 0 &&
									myKingdom.population + 3 * myKingdom.popChange <= 0
										? "danger-text"
										: ""
								}
								title="Population"
							>
								P: {myKingdom.population.toLocaleString()}
							</li>
							<li title="Power">W: {myKingdom.power.toLocaleString()}</li>
						</ul>
					</nav>
					<nav className={`main-nav ${isMenuOpen ? "open" : ""}`}>
						<div className="mobile-only-footer-stats">
							<strong>$: {myKingdom.money.toLocaleString()}</strong>
						</div>
						<ul className="mobile-toggle-wrap mobile-footer-toggle">
							<li>
								<button
									type="button"
									className="outline hamburger-button"
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									aria-label="Toggle menu"
								>
									<span
										className={`hamburger-icon ${isMenuOpen ? "open" : ""}`}
									></span>
								</button>
							</li>
						</ul>
						<ul className="nav-links">
							<li>
								<Link to="/kingdom/status" onClick={() => setIsMenuOpen(false)}>
									Status
								</Link>
							</li>
							<li>
								<Link to="/kingdom/growth" onClick={() => setIsMenuOpen(false)}>
									Growth
								</Link>
							</li>
							<li>
								<Link
									to="/kingdom/military"
									onClick={() => setIsMenuOpen(false)}
								>
									Military
								</Link>
							</li>
							<li>
								<Link
									to="/kingdom/research"
									onClick={() => setIsMenuOpen(false)}
								>
									Research
								</Link>
							</li>
							<li>
								<Link
									to="/kingdom/targets"
									onClick={() => setIsMenuOpen(false)}
								>
									Targets
								</Link>
							</li>
							<li>
								<Link
									to="/kingdom/reports"
									onClick={() => setIsMenuOpen(false)}
								>
									Reports
								</Link>
							</li>
						</ul>
						<ul className="nav-actions">
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
								<Link
									to="/kingdom/profile"
									onClick={() => setIsMenuOpen(false)}
								>
									Profile
								</Link>
							</li>
						</ul>
					</nav>
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
		</>
	);
}

function KingdomLayout() {
	return (
		<KingdomMessageProvider>
			<KingdomLayoutContent />
		</KingdomMessageProvider>
	);
}
