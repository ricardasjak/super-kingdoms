import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/kingdom/delete")({
	component: KingdomDeletePage,
});

function KingdomDeletePage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const deleteKingdom = useMutation(api.kingdoms.deleteKingdom);

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/create" });
		return null;
	}

	const handleDelete = async () => {
		try {
			await deleteKingdom();
			navigate({ to: "/create" });
		} catch (error) {
			console.error("Failed to delete kingdom", error);
			alert("Failed to delete kingdom. Please try again.");
		}
	};

	return (
		<main className="container">
			<article className="contrast">
				<header>
					<hgroup>
						<h2>Abdicate Your Throne</h2>
						<p>
							Are you absolutely sure you want to delete {myKingdom.kdName}?
						</p>
					</hgroup>
				</header>

				<p>
					<strong>Warning:</strong> Deleting your kingdom is permanent. All your
					land, population, units, and resources will be irrevocably destroyed
					and scattered to the solar winds.
				</p>

				<footer>
					<div className="grid">
						<button
							type="button"
							className="secondary"
							onClick={() => navigate({ to: "/kingdom/status" })}
						>
							Cancel
						</button>
						<button type="button" className="contrast" onClick={handleDelete}>
							Yes, Delete My Kingdom
						</button>
					</div>
				</footer>
			</article>
		</main>
	);
}
