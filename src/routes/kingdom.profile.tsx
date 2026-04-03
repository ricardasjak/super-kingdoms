import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";
import { useTheme } from "../contexts/ThemeContext";

export const Route = createFileRoute("/kingdom/profile")({
	component: KingdomProfilePage,
});

function KingdomProfilePage() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const updateRulerName = useMutation(api.kingdoms.updateRulerName);
	const resetKingdom = useMutation(api.kingdoms.resetKingdom);
	const navigate = useNavigate();
	const { showMessage } = useKingdomMessage();
	const { theme, toggleTheme } = useTheme();

	const [newName, setNewName] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [isResetting, setIsResetting] = useState(false);

	if (!myKingdom) return null;

	const handleUpdateName = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName || newName.trim() === "") {
			showMessage("Ruler name cannot be empty", "error");
			return;
		}

		setIsUpdating(true);
		try {
			await updateRulerName({ rulerName: newName.trim() });
			setNewName("");
			showMessage("Ruler name updated successfully!", "success");
		} catch (err) {
			console.error(err);
			showMessage(
				err instanceof Error ? err.message : "Failed to update ruler name",
				"error",
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleResetKingdom = async () => {
		if (
			!window.confirm(
				"Are you sure you want to RESET your kingdom to the starting state? This action cannot be undone.",
			)
		) {
			return;
		}

		setIsResetting(true);
		try {
			await resetKingdom();
			showMessage("Kingdom reset successfully!", "success");
			navigate({ to: "/kingdom/status" });
		} catch (err) {
			console.error(err);
			showMessage(
				err instanceof Error ? err.message : "Failed to reset kingdom",
				"error",
			);
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>Ruler Profile</h2>
						<p>Manage your account settings</p>
					</hgroup>
				</header>

				<section>
					<h3>Update Ruler Details</h3>
					<p>
						Current Ruler Name: <strong>{myKingdom.rulerName}</strong>
					</p>

					<form onSubmit={handleUpdateName}>
						<label htmlFor="rulerName">
							New Ruler Name
							<input
								id="rulerName"
								type="text"
								value={newName}
								onChange={(e) => {
									setNewName(e.target.value);
								}}
								disabled={isUpdating}
								placeholder="Enter a new ruler name"
							/>
						</label>
						<button
							type="submit"
							disabled={isUpdating || newName.trim() === ""}
						>
							{isUpdating ? "Updating..." : "Update Ruler Name"}
						</button>
					</form>
				</section>
			</article>

			<article>
				<header>
					<strong>Appearance Settings</strong>
				</header>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div>
						<strong>
							Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
						</strong>
						<p
							style={{
								margin: 0,
								fontSize: "0.9rem",
								color: "var(--pico-muted-color)",
							}}
						>
							Switch between light and dark modes.
						</p>
					</div>
					<button
						type="button"
						className="outline contrast"
						onClick={toggleTheme}
						style={{ width: "auto", marginBottom: 0 }}
					>
						{theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
					</button>
				</div>
			</article>

			<article>
				<header>
					<strong>Danger Zone</strong>
				</header>
				<p>Administrative and destructive actions for your account.</p>

				<div className="grid">
					<div>
						<Link
							to="/auth/signout"
							role="button"
							className="secondary outline"
						>
							Sign out
						</Link>
						<small
							style={{ display: "block", marginTop: "0.5rem" }}
							className="text-muted"
						>
							Sign out of this device. Your kingdom will be safe.
						</small>
					</div>

					<div>
						<button
							type="button"
							className="outline"
							onClick={handleResetKingdom}
							disabled={isResetting}
							style={{ borderColor: "var(--pico-del-color)", color: "var(--pico-del-color)" }}
						>
							{isResetting ? "Resetting..." : "Reset Kingdom"}
						</button>
						<small
							style={{ display: "block", marginTop: "0.5rem" }}
							className="text-muted"
						>
							Resets your kingdom to initial state. Keeps owned bots.
						</small>
					</div>

					<div>
						<Link
							to="/kingdom/delete"
							role="button"
							className="contrast outline"
						>
							Delete Kingdom
						</Link>
						<small
							style={{ display: "block", marginTop: "0.5rem" }}
							className="text-muted"
						>
							Permantely remove your kingdom. This action cannot be undone.
						</small>
					</div>
				</div>
			</article>
		</main>
	);
}
