import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "../../convex/_generated/api";
import { PLANET_TYPES, RACE_TYPES } from "../constants/game-params";

export const Route = createFileRoute("/kingdom/create")({
	component: CreateKingdomPage,
});

type FormData = {
	kdName: string;
	rulerName: string;
	planetType: string;
	raceType: string;
};

function CreateKingdomPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const createKingdom = useMutation(api.kingdoms.createKingdom);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>();

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading...</p>;
	}

	if (myKingdom) {
		navigate({ to: "/kingdom/status" });
		return null;
	}

	const onSubmit = async (data: FormData) => {
		try {
			await createKingdom({
				kdName: data.kdName,
				rulerName: data.rulerName,
				planetType: data.planetType,
				raceType: data.raceType,
			});
			navigate({ to: "/kingdom/status" });
		} catch (error) {
			console.error("Failed to create kingdom", error);
			alert("Failed to create kingdom. Please try again.");
		}
	};

	return (
		<main className="container">
			<article>
				<header>
					<h2>Create Your Kingdom</h2>
					<p>Begin your legacy among the stars.</p>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<label>
						Kingdom Name
						<input
							type="text"
							{...register("kdName", { required: "Kingdom Name is required" })}
							aria-invalid={errors.kdName ? "true" : undefined}
						/>
						{errors.kdName && <small>{errors.kdName.message}</small>}
					</label>

					<label>
						Ruler Name
						<input
							type="text"
							{...register("rulerName", { required: "Ruler Name is required" })}
							aria-invalid={errors.rulerName ? "true" : undefined}
						/>
						{errors.rulerName && <small>{errors.rulerName.message}</small>}
					</label>

					<label>
						Planet Type
						<select
							{...register("planetType", {
								required: "Planet Type is required",
							})}
							aria-invalid={errors.planetType ? "true" : undefined}
						>
							<option value="">Select a Planet Type...</option>
							{PLANET_TYPES.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						{errors.planetType && <small>{errors.planetType.message}</small>}
					</label>

					<label>
						Race Type
						<select
							{...register("raceType", { required: "Race Type is required" })}
							aria-invalid={errors.raceType ? "true" : undefined}
						>
							<option value="">Select a Race...</option>
							{RACE_TYPES.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						{errors.raceType && <small>{errors.raceType.message}</small>}
					</label>

					<button type="submit" aria-busy={isSubmitting}>
						Found Kingdom
					</button>
				</form>
			</article>
		</main>
	);
}
