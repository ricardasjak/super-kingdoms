import type { BuildingType } from "../types/game";
import type { BuildingState, KingdomSettings } from "./types";

export type GrowthUpdate = {
	updatedKingdom: Pick<KingdomSettings, "land" | "landQueue" | "money">;
	updatedBuildings: BuildingState;
	kingdomChanged: boolean;
	queueChanged: boolean;
};

/**
 * Handles exploration, land queue, and building construction.
 */
export function handleGrowth(
	kingdom: KingdomSettings,
	buildings: BuildingState,
): GrowthUpdate {
	let kingdomChanged = false;
	let queueChanged = false;

	const updatedKingdom = {
		land: kingdom.land,
		landQueue: [...kingdom.landQueue],
		money: kingdom.money,
	};
	const updatedBuildings = {
		...buildings,
		queue: { ...buildings.queue },
	};

	// 1. Exploration Completion
	if (updatedKingdom.landQueue.length > 0) {
		updatedKingdom.land += updatedKingdom.landQueue[0];
		updatedKingdom.landQueue = updatedKingdom.landQueue.slice(1);
		kingdomChanged = true;
	}

	// 3. Building Completion
	const buildKeys: BuildingType[] = [
		"res",
		"plants",
		"rax",
		"sm",
		"pf",
		"tc",
		"asb",
	];
	for (const key of buildKeys) {
		if (updatedBuildings.queue[key] && updatedBuildings.queue[key].length > 0) {
			const completed = updatedBuildings.queue[key][0];
			updatedBuildings[key] += completed;
			updatedBuildings.queue[key] = updatedBuildings.queue[key].slice(1);
			queueChanged = true;
		}
	}

	return { updatedKingdom, updatedBuildings, kingdomChanged, queueChanged };
}
