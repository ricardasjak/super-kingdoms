import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BOT_PROFILES } from "../constants/bot-params";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";

export const Route = createFileRoute("/kingdom/settings")({
	component: KingdomSettingsPage,
});

function KingdomSettingsPage() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const updateBotProfile = useMutation(api.kingdoms.updateBotProfile);
	const { showMessage } = useKingdomMessage();

	if (!myKingdom) return null;

	const handleProfileChange = async (profile: string | null) => {
		try {
			await updateBotProfile({ botProfile: profile || undefined });
			showMessage(
				profile
					? `Bot profile updated to ${profile}`
					: "Bot profile cleared (None)",
				"success",
			);
		} catch (error) {
			console.error(error);
			showMessage(
				error instanceof Error ? error.message : "Update failed",
				"error",
			);
		}
	};

	const profiles = (
		Object.keys(BOT_PROFILES) as (keyof typeof BOT_PROFILES)[]
	).sort((a, b) => {
		const profileA = BOT_PROFILES[a];
		const profileB = BOT_PROFILES[b];

		if (profileB.exploration !== profileA.exploration) {
			return profileB.exploration - profileA.exploration;
		}
		if (profileB.science !== profileA.science) {
			return profileB.science - profileA.science;
		}
		return profileB.defense - profileA.defense;
	});

	return (
		<main className="container">
			<article>
				<header>
					<h2>Kingdom Settings</h2>
					<p style={{ margin: 0, color: "var(--pico-muted-color)" }}>
						Manage kingdom automation and bot profiles.
					</p>
				</header>

				<section>
					<label htmlFor="botProfile">
						<strong>Active Bot Profile</strong>
					</label>
					<div
						style={{
							display: "flex",
							gap: "1rem",
							alignItems: "center",
							marginTop: "0.5rem",
						}}
					>
						<select
							id="botProfile"
							value={myKingdom.botProfile || ""}
							onChange={(e) => handleProfileChange(e.target.value || null)}
							style={{ marginBottom: 0, flex: 1 }}
						>
							<option value="">None (Manual handling)</option>
							{profiles.map((p) => (
								<option key={p} value={p}>
									{p.charAt(0).toUpperCase() + p.slice(1)}
								</option>
							))}
						</select>
						{myKingdom.botProfile && (
							<span
								style={{
									padding: "0.25rem 0.75rem",
									backgroundColor: "var(--pico-ins-color)",
									color: "white",
									borderRadius: "1rem",
									fontSize: "0.8rem",
									fontWeight: "bold",
								}}
							>
								ACTIVE
							</span>
						)}
					</div>
					<p style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
						Selecting a bot profile will allow the system to automatically
						manage your kingdom's economy, buildings, and military based on the
						chosen strategy.
					</p>
				</section>

				<section style={{ marginTop: "2rem" }}>
					<h3>Profile Details</h3>
					<figure>
						<table className="striped">
							<thead>
								<tr>
									<th>Profile</th>
									<th>Exploration</th>
									<th>Offense</th>
									<th>Defense</th>
									<th>Flex</th>
									<th>Science</th>
								</tr>
							</thead>
							<tbody>
								{profiles.map((p) => {
									const profile = BOT_PROFILES[p as keyof typeof BOT_PROFILES];
									const isActive = myKingdom.botProfile === p;
									return (
										<tr
											key={p}
											style={{
												backgroundColor: isActive
													? "rgba(0, 255, 0, 0.05)"
													: "transparent",
												fontWeight: isActive ? "bold" : "normal",
											}}
										>
											<td>{p.charAt(0).toUpperCase() + p.slice(1)}</td>
											<td>{profile.exploration}</td>
											<td>{profile.offense}%</td>
											<td>{profile.defense}%</td>
											<td>{profile.flex}%</td>
											<td>{profile.science}%</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</figure>
				</section>

				<footer style={{ marginTop: "2rem" }}>
					<p style={{ fontSize: "0.8rem", color: "var(--pico-muted-color)" }}>
						Bot profiles are typically used for automated kingdoms, but can be
						manually assigned to player kingdoms for testing or automation
						purposes.
					</p>
				</footer>
			</article>
		</main>
	);
}
