import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { useKingdomMessage } from "../contexts/KingdomMessageContext";

export const Route = createFileRoute("/kingdom/profile")({
	component: KingdomProfilePage,
});

function KingdomProfilePage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const updateRulerName = useMutation(api.kingdoms.updateRulerName);
	const { showMessage } = useKingdomMessage();

	const [newName, setNewName] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	if (myKingdom === undefined) {
		return (
			<main className="container">
				<article aria-busy="true">Loading profile...</article>
			</main>
		);
	}

	if (myKingdom === null) {
		navigate({ to: "/create" });
		return null;
	}

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
