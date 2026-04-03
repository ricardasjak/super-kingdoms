import { BOT_PARAMS } from "../../constants/bot-params";
import { GAME_PARAMS } from "../../constants/game-params";
import type { BuildingType, MilitaryUnitType } from "../../types/game";
import {
	type BuildingCounts,
	calculateFreeLand,
	calculateMilitaryQueue,
	calculateNewQueue,
} from "../../utils/buildingUtils";
import { calculateExplorationQueue } from "../../utils/landUtils";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "../types";

export type AutoGrowthUpdate = {
	money: number;
	buildingQueue: BuildingState["queue"];
	landQueue: number[];
	changed: boolean;
	militaryQueue?: MilitaryUnits["queue"];
	militarySol?: number;
};

/**
 * Handles automatic exploration, building construction and military training based on kingdom settings.
 */
export function handleAutoGrowth(
	kingdom: Pick<
		KingdomSettings,
		| "autoBuild"
		| "autoExplore"
		| "land"
		| "money"
		| "landQueue"
		| "population"
		| "research"
	>,
	buildings: BuildingState,
	buildKeys: BuildingType[],
	military?: MilitaryUnits,
): AutoGrowthUpdate {
	let money = kingdom.money;
	let buildingQueue = { ...buildings.queue };
	let landQueue = [...kingdom.landQueue];
	let changed = false;
	let militaryQueue = military ? { ...military.queue } : undefined;
	let militarySol = military?.sol;

	// 1. Auto Explore
	if ((Number(kingdom.autoExplore) || 0) > 0) {
		const level = Number(kingdom.autoExplore);
		const limitPct = level * 0.01;
		const currentQueueSum = landQueue.reduce((a, b) => a + b, 0);
		const maxExplorePossible =
			Math.floor(kingdom.land * limitPct) - currentQueueSum;

		if (maxExplorePossible > 0) {
			const baseCost = GAME_PARAMS.explore.cost(kingdom.land);
			const levelMultiplier =
				GAME_PARAMS.explore.levelMultipliers[level - 1] ?? 1;

			let landMultiplier = 1;
			if (kingdom.land < 1000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
			else if (kingdom.land < 2500)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
			else if (kingdom.land < 5000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];

			const costPerLand = Math.round(
				baseCost * levelMultiplier * landMultiplier,
			);
			const exploreNum = Math.floor(
				Math.min(maxExplorePossible, money / costPerLand),
			);
			const roundedExplore = Math.floor(exploreNum / 24) * 24;

			if (roundedExplore > 0) {
				money -= roundedExplore * costPerLand;
				landQueue = calculateExplorationQueue(
					landQueue,
					roundedExplore,
					GAME_PARAMS.explore.duration,
				);
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
				const current =
					buildings[key] +
					(buildingQueue[key]?.reduce((a, b) => a + b, 0) || 0);
				const deficiency = Math.max(
					0,
					Math.floor((kingdom.land * target) / 100) - current,
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
							if (stillNeeded > 0 && (buildings.target[key] || 0) < minTarget) {
								minTarget = buildings.target[key] || 0;
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
						money -= actualBuilt * buildingCost;
						buildingQueue = calculateNewQueue(
							buildingQueue,
							constructionGroup,
							GAME_PARAMS.buildings.duration,
						);
						changed = true;
					}
				}
			}
		}
	}

	// 3. Military Growth
	if (kingdom.autoBuild && military && militaryQueue) {
		// 3.1 Buy Soldiers
		const mq = militaryQueue;
		const trainingLimit = Math.floor(
			kingdom.population * GAME_PARAMS.military.soldiersLimit,
		);
		const currentSolInQueue = (mq.sol || []).reduce((a, b) => a + b, 0);
		const availableTrainingCapacity = Math.max(
			0,
			trainingLimit - currentSolInQueue,
		);

		const botLimit = Math.max(
			BOT_PARAMS.soldiersMinimum,
			kingdom.land * BOT_PARAMS.soldiersLimitPerLand,
		);
		const currentSolTotal = (militarySol || 0) + currentSolInQueue;
		const neededToBotLimit = Math.max(0, botLimit - currentSolTotal);

		const solToBuy = Math.min(availableTrainingCapacity, neededToBotLimit);

		if (solToBuy > 0) {
			const solCost = GAME_PARAMS.military.units.sol.cost;
			const maxByMoney = Math.floor(money / solCost);
			let actualSol = Math.min(solToBuy, maxByMoney);

			// Round to GAME_PARAMS.military.soldierDuration
			actualSol =
				Math.floor(actualSol / GAME_PARAMS.military.soldierDuration) *
				GAME_PARAMS.military.soldierDuration;

			if (actualSol > 0) {
				money -= actualSol * solCost;
				militaryQueue = calculateMilitaryQueue(
					militaryQueue,
					{
						sol: actualSol,
						tr: 0,
						dr: 0,
						ft: 0,
						tf: 0,
						lt: 0,
						ld: 0,
						lf: 0,
						f74: 0,
						t: 0,
						ht: 0,
						sci: 0,
					},
					GAME_PARAMS.military.soldierDuration,
				);
				changed = true;
			}
		}

		// 3.2 Military Production
		if (military.target) {
			const tcDiscount = GAME_PARAMS.military.calculateTcDiscount(
				buildings.tc || 0,
				kingdom.land,
			);
			const getCost = (unit: MilitaryUnitType) => {
				const base = GAME_PARAMS.military.units[unit].cost;
				if (unit === "sol" || unit === "sci") return base;
				return Math.floor((base * (100 - tcDiscount)) / 100);
			};

			const prodKeys = (
				Object.keys(military.target) as MilitaryUnitType[]
			).filter((k) => k !== "sol" && (military.target?.[k] || 0) > 0);
			const initialMilitaryBudget = money;
			const initialMilitarySol = militarySol || 0;
			const requestedProduction: Record<MilitaryUnitType, number> = {
				sol: 0,
				tr: 0,
				dr: 0,
				ft: 0,
				tf: 0,
				lt: 0,
				ld: 0,
				lf: 0,
				f74: 0,
				t: 0,
				ht: 0,
				sci: 0,
			};
			let productionChanged = false;

			for (const key of prodKeys) {
				const ratio = (military.target?.[key] || 0) / 100;
				const targetBudget = initialMilitaryBudget * ratio;
				const availableBudget = Math.min(money, targetBudget);

				const targetSolBudget = Math.floor(initialMilitarySol * ratio);
				const availableSolForThisUnit = Math.max(
					0,
					Math.min(militarySol || 0, targetSolBudget),
				);

				if (availableBudget <= 0) continue;

				const cost = getCost(key);
				const solReq = GAME_PARAMS.military.units[key].sol || 0;

				let maxUnits = Math.floor(availableBudget / cost);

				// Soldier constraint
				if (solReq > 0) {
					maxUnits = Math.min(
						maxUnits,
						Math.floor(availableSolForThisUnit / solReq),
					);
				}

				// ASB constraint
				if (GAME_PARAMS.military.units[key].buildingRequired === "asb") {
					const asbTotal = buildings.asb * GAME_PARAMS.buildings.asbCapacity;
					const asbUsed = (
						Object.keys(GAME_PARAMS.military.units) as MilitaryUnitType[]
					).reduce((sum, k) => {
						if (GAME_PARAMS.military.units[k].buildingRequired !== "asb")
							return sum;
						const owned = (military[k] as number) || 0;
						const currReq = requestedProduction[k] || 0;
						const inQ = (mq[k] || []).reduce((a, b) => a + b, 0);
						return (
							sum +
							(owned + inQ + currReq) * GAME_PARAMS.military.units[k].housing
						);
					}, 0);
					const asbLeft = Math.max(0, asbTotal - asbUsed);
					maxUnits = Math.min(
						maxUnits,
						Math.floor(asbLeft / GAME_PARAMS.military.units[key].housing),
					);
				}

				// Prerequisites
				const config = GAME_PARAMS.military.units[key];
				if (
					config.researchRequired &&
					(kingdom.research[
						config.researchRequired as keyof typeof kingdom.research
					]?.perc ?? 0) < 100
				)
					maxUnits = 0;
				if (
					config.buildingRequired &&
					(buildings[config.buildingRequired] as number) <= 0
				)
					maxUnits = 0;

				// Batching GAME_PARAMS.military.duration
				const count =
					Math.floor(maxUnits / GAME_PARAMS.military.duration) *
					GAME_PARAMS.military.duration;
				if (count > 0) {
					money -= count * cost;
					if (militarySol !== undefined) {
						militarySol -= count * solReq;
					}
					requestedProduction[key] = count;
					productionChanged = true;
				}
			}

			if (productionChanged) {
				militaryQueue = calculateMilitaryQueue(
					militaryQueue,
					requestedProduction,
					GAME_PARAMS.military.duration,
				);
				changed = true;
			}
		}
	}

	return {
		money,
		buildingQueue,
		landQueue,
		changed,
		militaryQueue,
		militarySol,
	};
}
