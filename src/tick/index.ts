import { handleEconomics } from "./handleEconomics";
import { handleGrowth } from "./handleGrowth";
import { handleMilitary } from "./handleMilitary";
import { handlePopulation } from "./handlePopulation";
import { handleResearch } from "./handleResearch";
import type {
	BuildingState,
	KingdomSettings,
	MilitaryUnits,
	TickResult,
} from "./types";

/**
 * Main entry point for processing a single game tick for a kingdom.
 * Orchestrates individual subjects in the correct order.
 */
export function processKingdomTick(
	kingdom: KingdomSettings,
	buildings: BuildingState,
	military: MilitaryUnits,
): TickResult {
	// Phase 1: Research Update (Bonuses apply in same tick)
	const researchUpdate = handleResearch(kingdom, military);

	// Create new kingdom state with research applied
	let updatedKingdom: KingdomSettings = {
		...kingdom,
		...researchUpdate,
	};

	// Phase 2: Economics (Income/Power)
	const economicsUpdate = handleEconomics(updatedKingdom, buildings, military);
	updatedKingdom = {
		...updatedKingdom,
		...economicsUpdate,
	};

	// Phase 3: Population (Growth depends on housing/rax)
	const populationUpdate = handlePopulation(
		updatedKingdom,
		buildings,
		military,
	);
	updatedKingdom = {
		...updatedKingdom,
		...populationUpdate,
	};

	// Phase 4: Growth (Land & Buildings)
	const growthUpdate = handleGrowth(updatedKingdom, buildings);
	updatedKingdom = {
		...updatedKingdom,
		...growthUpdate.updatedKingdom,
	};
	const updatedBuildings = growthUpdate.updatedBuildings;

	// Phase 5: Military (Training & Promotions)
	const militaryUpdate = handleMilitary(updatedKingdom, military);

	return {
		updatedKingdom,
		updatedBuildings: growthUpdate.queueChanged ? updatedBuildings : null,
		updatedMilitary: militaryUpdate.militaryChanged
			? militaryUpdate.updatedMilitary
			: null,
		kingdomChanged: growthUpdate.kingdomChanged,
	};
}
