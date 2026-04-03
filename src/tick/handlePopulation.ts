import { GAME_PARAMS } from "../constants/game-params";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "./types";

export type PopulationUpdate = Pick<
	KingdomSettings,
	"population" | "popChange" | "state"
>;

/**
 * Handles population growth and housing limits.
 */
export function handlePopulation(
	kingdom: KingdomSettings,
	buildings: BuildingState,
	military: MilitaryUnits,
): PopulationUpdate {
	const popBonus = (kingdom.research.pop?.perc ?? 0) / 100;
	const longBonus =
		(kingdom.research.r_long?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.r_long?.bonus ?? 0)
			: 0;

	const raxUsage = (
		Object.keys(GAME_PARAMS.military.units) as Array<
			keyof typeof GAME_PARAMS.military.units
		>
	).reduce((acc, key) => {
		const weight = key === "t" || key === "ht" ? 2 : 1;
		return acc + (military[key] || 0) * weight;
	}, 0);
	const raxCapacity = buildings.rax * GAME_PARAMS.buildings.raxCapacity;
	const raxSurplus = Math.max(0, raxUsage - raxCapacity);

	const resCapacityBoosted =
		(GAME_PARAMS.buildings.resCapacity + longBonus) * (1 + popBonus);
	const maxPopulation = Math.floor(
		buildings.res * resCapacityBoosted - raxSurplus,
	);

	let populationChange = 0;
	if (kingdom.population < maxPopulation) {
		populationChange = Math.ceil(
			kingdom.population * GAME_PARAMS.population.growth,
		);
		populationChange = Math.min(
			populationChange,
			maxPopulation - kingdom.population,
		);
	} else if (kingdom.population > maxPopulation) {
		populationChange = -GAME_PARAMS.population.decline(
			kingdom.population,
			kingdom.land,
		);
	}

	const population = Math.round(
		Math.max(0, kingdom.population + populationChange),
	);
	const state = population <= 0 ? "dead" : kingdom.state;

	return {
		population,
		popChange: populationChange,
		state,
	};
}
