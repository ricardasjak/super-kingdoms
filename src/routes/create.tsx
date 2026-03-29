import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "../../convex/_generated/api";
import {
	GAME_PARAMS,
	PLANET_TYPES,
	RACE_TYPES,
} from "../constants/game-params";

export const Route = createFileRoute("/create")({
	component: CreateKingdomPage,
});

type FormData = {
	kdName: string;
	rulerName: string;
	planetType: string;
	raceType: string;
	botNames: string[];
};

import { BOT_NAME_PREFIXES, BOT_NAME_SUFFIXES } from "../constants/bot-names";

const generateRandomBotName = (prefix: string) => {
	const s =
		BOT_NAME_SUFFIXES[Math.floor(Math.random() * BOT_NAME_SUFFIXES.length)];
	return `${prefix} ${s} ${Math.floor(Math.random() * 999)}`;
};

function CreateKingdomPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const createKingdom = useMutation(api.kingdoms.createKingdom);
	const botLimit = GAME_PARAMS.bots.limitPerKingdom;

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({
		defaultValues: {
			botNames: Array(botLimit).fill(""),
		},
	});

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading...</p>;
	}

	if (myKingdom) {
		navigate({ to: "/kingdom/status" });
		return null;
	}

	const randomizeBotNames = () => {
		const kdName = getValues("kdName") || "";
		let prefix = kdName.split(" ")[0] || "";

		if (!prefix) {
			prefix =
				BOT_NAME_PREFIXES[Math.floor(Math.random() * BOT_NAME_PREFIXES.length)];
		}

		for (let i = 0; i < botLimit; i++) {
			setValue(`botNames.${i}`, generateRandomBotName(prefix));
		}
	};

	const onSubmit = async (data: FormData) => {
		try {
			await createKingdom({
				kdName: data.kdName,
				rulerName: data.rulerName,
				planetType: data.planetType,
				raceType: data.raceType,
				botNames: data.botNames.filter((name) => name.trim() !== ""),
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
					<div className="grid">
						<label>
							Kingdom Name
							<input
								type="text"
								{...register("kdName", {
									required: "Kingdom Name is required",
								})}
								aria-invalid={errors.kdName ? "true" : undefined}
							/>
							{errors.kdName && <small>{errors.kdName.message}</small>}
						</label>

						<label>
							Ruler Name
							<input
								type="text"
								{...register("rulerName", {
									required: "Ruler Name is required",
								})}
								aria-invalid={errors.rulerName ? "true" : undefined}
							/>
							{errors.rulerName && <small>{errors.rulerName.message}</small>}
						</label>
					</div>

					<div className="grid">
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
					</div>

					<hr />

					<section>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "1rem",
							}}
						>
							<h4 style={{ margin: 0 }}>Subordinate Bot Kingdoms</h4>
							<button
								type="button"
								className="outline secondary"
								onClick={randomizeBotNames}
								style={{ width: "auto" }}
							>
								Randomize Bot Names
							</button>
						</div>
						<p>
							Provide names for the {botLimit} kingdoms that will start under
							your influence. Leave empty for random names.
						</p>
						<div className="grid">
							{Array.from({ length: botLimit }).map((_, i) => {
								const key = `bot-field-${i}`;
								return (
									<label key={key}>
										Bot #{i + 1} Name
										<input
											type="text"
											{...register(`botNames.${i}` as const)}
										/>
									</label>
								);
							})}
						</div>
					</section>

					<button type="submit" aria-busy={isSubmitting}>
						Found Kingdom
					</button>
				</form>
			</article>
		</main>
	);
}
