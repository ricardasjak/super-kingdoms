import { GAME_PARAMS } from "../../constants/game-params";
import type { BuildingType } from "../../types/game";
import { type BuildingCounts, calculateFreeLand, calculateNewQueue } from "../../utils/buildingUtils";
import { calculateExplorationQueue } from "../../utils/landUtils";
import type { BuildingState, KingdomSettings } from "../types";

export type AutoGrowthUpdate = {
	money: number;
	buildingQueue: BuildingState["queue"];
	landQueue: number[];
	changed: boolean;
};

/**
 * Handles automatic exploration and building construction based on kingdom settings.
 */
export function handleAutoGrowth(
	kingdom: Pick<KingdomSettings, "autoBuild" | "autoExplore" | "land" | "money" | "landQueue">,
	buildings: BuildingState,
	buildKeys: BuildingType[],
): AutoGrowthUpdate {
	let money = kingdom.money;
	let buildingQueue = { ...buildings.queue };
	let landQueue = [...kingdom.landQueue];
	let changed = false;

	// 1. Auto Explore
	if ((Number(kingdom.autoExplore) || 0) > 0) {
		const level = Number(kingdom.autoExplore);
		const limitPct = level * 0.01;
		const currentQueueSum = landQueue.reduce((a, b) => a + b, 0);
		const maxExplorePossible = Math.floor(kingdom.land * limitPct) - currentQueueSum;

		if (maxExplorePossible > 0) {
			const baseCost = GAME_PARAMS.explore.cost(kingdom.land);
			const levelMultiplier = GAME_PARAMS.explore.levelMultipliers[level - 1] ?? 1;

			let landMultiplier = 1;
			if (kingdom.land < 1000) landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
			else if (kingdom.land < 2500) landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
			else if (kingdom.land < 5000) landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];

			const costPerLand = Math.round(baseCost * levelMultiplier * landMultiplier);
			const exploreNum = Math.floor(Math.min(maxExplorePossible, money / costPerLand));
			const roundedExplore = Math.floor(exploreNum / 24) * 24;

			if (roundedExplore > 0) {
				money -= roundedExplore * costPerLand;
				landQueue = calculateExplorationQueue(landQueue, roundedExplore, GAME_PARAMS.explore.duration);
				changed = true;
			}
		}
	}

	// 2. Auto Build
	if (kingdom.autoBuild && buildings.target) {
		const freeLand = calculateFreeLand(kingdom.land, buildings, buildingQueue);
		const buildingCost = GAME_PARAMS.buildings.cost(kingdom.land);
		const maxToBuild = Math.min(freeLand, Math.floor(money / buildingCost));

		if (maxToBuild > 0) {
			const deficiencies: Partial<Record<BuildingType, number>> = {};
			let totalDeficiency = 0;

			for (const key of buildKeys) {
				const target = buildings.target[key] || 0;
				const current = buildings[key] + (buildingQueue[key]?.reduce((a, b) => a + b, 0) || 0);
				const deficiency = Math.max(0, Math.floor((kingdom.land * target) / 100) - current);
				deficiencies[key] = deficiency;
				totalDeficiency += deficiency;
			}

			if (totalDeficiency > 0) {
				const toBuildRaw = Math.min(maxToBuild, totalDeficiency);
				let remainingChunks = Math.floor(toBuildRaw / GAME_PARAMS.buildings.duration);

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
							const stillNeeded = (deficiencies[key] || 0) - (constructionGroup[key] || 0);
							if (stillNeeded > 0 && (buildings.target[key] || 0) < minTarget) {
								minTarget = buildings.target[key] || 0;
								bestKey = key;
							}
						}
						if (!bestKey) break;
						constructionGroup[bestKey] += GAME_PARAMS.buildings.duration;
						remainingChunks--;
					}

					const actualBuilt = Object.values(constructionGroup).reduce((a, b) => a + b, 0);
					if (actualBuilt > 0) {
						money -= actualBuilt * buildingCost;
						buildingQueue = calculateNewQueue(buildingQueue, constructionGroup, GAME_PARAMS.buildings.duration);
						changed = true;
					}
				}
			}
		}
	}

	return { money, buildingQueue, landQueue, changed };
}
