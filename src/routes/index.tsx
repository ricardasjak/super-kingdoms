import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const myKingdom = useQuery(
		api.kingdoms.getMyKingdom,
		isAuthenticated ? {} : "skip",
	);

	return (
		<>
			<header>
				<hgroup>
					<h1>SuperKingdoms</h1>
					<p>Welcome to the game</p>
				</hgroup>
			</header>

			<section>
				{isLoading || (isAuthenticated && myKingdom === undefined) ? (
					<p aria-busy="true">Loading…</p>
				) : isAuthenticated ? (
					<article>
						<hgroup>
							<h2>You're in! 🎮</h2>
							<p>Welcome back to Super Kingdoms.</p>
						</hgroup>
						<div className="grid">
							{myKingdom ? (
								<Link to="/kingdom/status" role="button">
									Enter Kingdom
								</Link>
							) : (
								<Link to="/kingdom/create" role="button">
									Create Kingdom
								</Link>
							)}
							<Link
								to="/auth/signout"
								role="button"
								className="secondary outline"
							>
								Sign out
							</Link>
						</div>
					</article>
				) : (
					<article>
						<hgroup>
							<h2>Get Started</h2>
							<p>Sign in with your Discord account to start playing.</p>
						</hgroup>
						<Link to="/auth/signin" role="button">
							Sign in with Discord
						</Link>
					</article>
				)}
			</section>
		</>
	);
}
