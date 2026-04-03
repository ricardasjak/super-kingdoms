import { GAME_PARAMS } from "../constants/game-params";
import type { BuildingType } from "../types/game";
import {
	type BuildingCounts,
	calculateFreeLand,
	calculateNewQueue,
} from "../utils/buildingUtils";
import { calculateExplorationQueue } from "../utils/landUtils";
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

	// 1. Auto Explore
	if ((Number(kingdom.autoExplore) || 0) > 0) {
		const level = Number(kingdom.autoExplore);
		const limitPct = level * 0.01;
		const currentQueueSum = updatedKingdom.landQueue.reduce((a, b) => a + b, 0);
		const maxExplorePossible =
			Math.floor(updatedKingdom.land * limitPct) - currentQueueSum;

		if (maxExplorePossible > 0) {
			const baseCost = GAME_PARAMS.explore.cost(updatedKingdom.land);
			const levelMultiplier =
				GAME_PARAMS.explore.levelMultipliers[level - 1] ?? 1;

			let landMultiplier = 1;
			if (updatedKingdom.land < 1000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
			else if (updatedKingdom.land < 2500)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
			else if (updatedKingdom.land < 5000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];

			const costPerLand = Math.round(
				baseCost * levelMultiplier * landMultiplier,
			);
			const exploreNum = Math.floor(
				Math.min(maxExplorePossible, updatedKingdom.money / costPerLand),
			);
			const roundedExplore = Math.floor(exploreNum / 24) * 24;

			if (roundedExplore > 0) {
				updatedKingdom.money -= roundedExplore * costPerLand;
				updatedKingdom.landQueue = calculateExplorationQueue(
					updatedKingdom.landQueue,
					roundedExplore,
					GAME_PARAMS.explore.duration,
				);
				kingdomChanged = true;
			}
		}
	}

	// 2. Exploration Completion
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

	// 4. Auto Build
	if (kingdom.autoBuild && updatedBuildings.target) {
		const freeLand = calculateFreeLand(
			updatedKingdom.land,
			updatedBuildings,
			updatedBuildings.queue,
		);
		const buildingCost = GAME_PARAMS.buildings.cost(updatedKingdom.land);
		const maxToBuild = Math.min(
			freeLand,
			Math.floor(updatedKingdom.money / buildingCost),
		);

		if (maxToBuild > 0) {
			const deficiencies: Partial<Record<BuildingType, number>> = {};
			let totalDeficiency = 0;

			for (const key of buildKeys) {
				const target = updatedBuildings.target[key] || 0;
				const current =
					updatedBuildings[key] +
					(updatedBuildings.queue[key]?.reduce((a, b) => a + b, 0) || 0);
				const deficiency = Math.max(
					0,
					Math.floor((updatedKingdom.land * target) / 100) - current,
				);
				deficiencies[key] = deficiency;
				totalDeficiency += deficiency;
			}

			if (totalDeficiency > 0) {
				const toBuildRaw = Math.min(maxToBuild, totalDeficiency);
				let remainingChunks = Math.floor(
					toBuildRaw / GAME_PARAMS.buildings.duration,
				);

				if (remainingChunks > 0) {
					const constructionGroup: Omit<BuildingCounts, "rubble"> = {
						res: 0,
						plants: 0,
						rax: 0,
						sm: 0,
						pf: 0,
						tc: 0,
						asb: 0,
						ach: 0,
					};
					while (remainingChunks > 0) {
						let bestKey: BuildingType | null = null;
						let minTarget = Infinity;
						for (const key of buildKeys) {
							const stillNeeded =
								(deficiencies[key] || 0) - (constructionGroup[key] || 0);
							if (
								stillNeeded > 0 &&
								(updatedBuildings.target[key] || 0) < minTarget
							) {
								minTarget = updatedBuildings.target[key] || 0;
								bestKey = key;
							}
						}
						if (!bestKey) break;
						constructionGroup[bestKey] += GAME_PARAMS.buildings.duration;
						remainingChunks--;
					}

					const actualBuilt = Object.values(constructionGroup).reduce(
						(a, b) => a + b,
						0,
					);
					if (actualBuilt > 0) {
						updatedKingdom.money -= actualBuilt * buildingCost;
						updatedBuildings.queue = calculateNewQueue(
							updatedBuildings.queue,
							constructionGroup,
							GAME_PARAMS.buildings.duration,
						);
						queueChanged = true;
					}
				}
			}
		}
	}

	return { updatedKingdom, updatedBuildings, kingdomChanged, queueChanged };
}
