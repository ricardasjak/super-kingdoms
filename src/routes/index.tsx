import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { signIn, signOut } = useAuthActions();

	return (
		<>
			<header>
				<hgroup>
					<h1>SK-5</h1>
					<p>Welcome to the game</p>
				</hgroup>
			</header>

			<section>
				{isLoading ? (
					<p aria-busy="true">Loading…</p>
				) : isAuthenticated ? (
					<article>
						<h2>You're in! 🎮</h2>
						<p>You are signed in and ready to play.</p>
						<button
							type="button"
							className="secondary"
							onClick={() => void signOut()}
						>
							Sign out
						</button>
					</article>
				) : (
					<article>
						<h2>Get Started</h2>
						<p>Sign in with your Discord account to start playing.</p>
						<button type="button" onClick={() => void signIn("discord")}>
							Sign in with Discord
						</button>
					</article>
				)}
			</section>
		</>
	);
}
