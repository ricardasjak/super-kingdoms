import { GAME_PARAMS } from "../constants/game-params";
import { calculateFreeLand, calculateNewQueue } from "./buildingUtils";
import { calculateExplorationQueue } from "./landUtils";

export type MilitaryUnits = {
	sol: number;
	tr: number;
	dr: number;
	ft: number;
	tf: number;
	lt: number;
	ld: number;
	lf: number;
	f74: number;
	t: number;
	hgl: number;
	ht: number;
	sci: number;
	queue: {
		sol: number[];
		tr: number[];
		dr: number[];
		ft: number[];
		tf: number[];
		lt: number[];
		ld: number[];
		lf: number[];
		f74: number[];
		t: number[];
		hgl: number[];
		ht: number[];
		sci: number[];
	};
};

export type KingdomSettings = {
	population: number;
	land: number;
	money: number;
	power: number;
	probes: number;
	moneyIncome: number;
	powerIncome: number;
	landQueue: number[];
	autoExplore?: number;
	autoBuild?: boolean;
	researchPts: number;
	researchAutoAssign?: string[];
	research: {
		pop: { pts: number; perc: number };
		power: { pts: number; perc: number };
		mil: { pts: number; perc: number };
		money: { pts: number; perc: number };
		fdc: { pts: number; perc: number };
		warp: { pts: number; perc: number };
		dr?: { pts: number; perc: number };
		ft?: { pts: number; perc: number };
		tf?: { pts: number; perc: number };
		ld?: { pts: number; perc: number };
		lf?: { pts: number; perc: number };
		f74?: { pts: number; perc: number };
		hgl?: { pts: number; perc: number };
		ht?: { pts: number; perc: number };
		fusion?: { pts: number; perc: number };
		core?: { pts: number; perc: number };
		armor?: { pts: number; perc: number };
		long?: { pts: number; perc: number };
	};
	state?: "dead" | "newbiemode";
};

export type BuildingState = {
	res: number;
	plants: number;
	rax: number;
	sm: number;
	pf: number;
	tc: number;
	asb: number;
	ach: number;
	rubble: number;
	target?: {
		res: number;
		plants: number;
		rax: number;
		sm: number;
		pf: number;
		tc: number;
		asb: number;
		ach: number;
	};
	queue: {
		res: number[];
		plants: number[];
		rax: number[];
		sm: number[];
		pf: number[];
		tc: number[];
		asb: number[];
		ach: number[];
	};
};

export function processKingdomTick(
	kingdom: KingdomSettings,
	buildings: BuildingState,
	military: MilitaryUnits,
) {
	const moneyBonus = (kingdom.research.money?.perc ?? 0) / 100;
	const moneyIncome = Math.round(
		(buildings.sm * GAME_PARAMS.income.sm +
			kingdom.population * GAME_PARAMS.income.population) *
			(1 + moneyBonus),
	);
	const powerConsumption =
		kingdom.population * GAME_PARAMS.power.consumption.population +
		military.sci * GAME_PARAMS.power.consumption.scientists +
		military.sol * GAME_PARAMS.power.consumption.soldiers;
	const powerBonus = (kingdom.research.power?.perc ?? 0) / 100;
	const fusionBonus =
		(kingdom.research.fusion?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.fusion?.bonus ?? 0) / 100
			: 0;
	const coreBonus =
		(kingdom.research.core?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.core?.bonus ?? 0) / 100
			: 0;

	const powerIncome =
		buildings.plants *
			GAME_PARAMS.buildings.plantProduction *
			(1 + powerBonus + fusionBonus + coreBonus) -
		powerConsumption;

	const raxUsage =
		military.sol +
		military.tr +
		military.dr +
		military.ft +
		military.lt +
		military.ld +
		military.lf +
		military.sci +
		military.t * 2 +
		military.ht * 2;
	const raxCapacity = buildings.rax * GAME_PARAMS.buildings.raxCapacity;
	const raxSurplus = Math.max(0, raxUsage - raxCapacity);

	const popBonus = (kingdom.research.pop?.perc ?? 0) / 100;
	const longBonus =
		(kingdom.research.long?.perc ?? 0) >= 100
			? (GAME_PARAMS.militaryTechTree.long?.bonus ?? 0)
			: 0;
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

	const newKingdom = {
		...kingdom,
		money: kingdom.money + moneyIncome,
		population: Math.round(Math.max(0, kingdom.population + populationChange)),
		popChange: populationChange,
	};

	if (newKingdom.population <= 0) {
		newKingdom.state = "dead";
	}

	Object.assign(newKingdom, {
		power: Math.min(
			GAME_PARAMS.buildings.plantStorage * buildings.plants,
			Math.max(0, Math.round(kingdom.power + powerIncome)),
		),
		probes: kingdom.probes + buildings.pf,
		moneyIncome: moneyIncome,
		powerIncome: Math.round(powerIncome),
		researchPts: kingdom.researchPts + military.sci,
		research: { ...kingdom.research },
		land: kingdom.land,
		landQueue: [...kingdom.landQueue],
	});

	let kingdomChanged = false;

	if ((Number(newKingdom.autoExplore) || 0) > 0) {
		const level = Number(newKingdom.autoExplore);
		const limitPct = level * 0.01; // 0.01 (1%), ..., 0.10 (10%)
		const currentQueueSum = newKingdom.landQueue.reduce((a, b) => a + b, 0);
		const maxPossibleExplore = Math.floor(newKingdom.land * limitPct);
		const maxExplore = Math.max(0, maxPossibleExplore - currentQueueSum);

		if (maxExplore > 0) {
			const baseCost = GAME_PARAMS.explore.cost(newKingdom.land);
			const levelMultiplier =
				GAME_PARAMS.explore.levelMultipliers[level - 1] ?? 1;

			let landMultiplier = 1;
			if (newKingdom.land < 1000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[1000];
			else if (newKingdom.land < 2500)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[2500];
			else if (newKingdom.land < 5000)
				landMultiplier = GAME_PARAMS.explore.landLevelMultipliers[5000];

			const costPerLand = Math.round(
				baseCost * levelMultiplier * landMultiplier,
			);

			const maxAffordable = Math.floor(newKingdom.money / costPerLand);
			const exploreAmount = Math.floor(Math.min(maxExplore, maxAffordable));
			const validExploreAmount = Math.floor(exploreAmount / 24) * 24;

			if (validExploreAmount > 0) {
				newKingdom.money -= validExploreAmount * costPerLand;
				newKingdom.landQueue = calculateExplorationQueue(
					newKingdom.landQueue,
					validExploreAmount,
					GAME_PARAMS.explore.duration,
				);
				kingdomChanged = true;
			}
		}
	}

	if (newKingdom.landQueue.length > 0) {
		const completedLand = newKingdom.landQueue[0];
		newKingdom.land += completedLand;
		newKingdom.landQueue = newKingdom.landQueue.slice(1);
		kingdomChanged = true;
	}

	const newBuildings = { ...buildings };
	const newQueue = { ...buildings.queue };
	const keys = [
		"res",
		"plants",
		"rax",
		"sm",
		"pf",
		"tc",
		"asb",
		"ach",
	] as const;
	let queueChanged = false;

	for (const key of keys) {
		if (newQueue[key] && newQueue[key].length > 0) {
			const completedCount = newQueue[key][0];
			newBuildings[key] += completedCount;
			newQueue[key] = newQueue[key].slice(1);
			queueChanged = true;
		}
	}

	if (queueChanged) {
		newBuildings.queue = newQueue;
	}

	if (newKingdom.autoBuild && buildings.target) {
		const freeLand = calculateFreeLand(
			newKingdom.land,
			newBuildings,
			newBuildings.queue,
		);

		if (freeLand > 0) {
			const buildingCost = GAME_PARAMS.buildings.cost(newKingdom.land);
			const maxAffordable = Math.floor(newKingdom.money / buildingCost);
			const maxToBuild = Math.min(freeLand, maxAffordable);

			if (maxToBuild > 0) {
				let totalDeficiency = 0;
				const deficiencies: Record<string, number> = {};

				for (const key of keys) {
					const targetPct = buildings.target[key] || 0;
					const desiredTotal = Math.floor((newKingdom.land * targetPct) / 100);

					const queuedCount =
						newBuildings.queue[key]?.reduce((a, b) => a + b, 0) || 0;
					const currentTotal = newBuildings[key] + queuedCount;

					const deficiency = Math.max(0, desiredTotal - currentTotal);
					deficiencies[key] = deficiency;
					totalDeficiency += deficiency;
				}

				if (totalDeficiency > 0) {
					const rawToBuild = Math.min(maxToBuild, totalDeficiency);
					const numChunks = Math.floor(
						rawToBuild / GAME_PARAMS.buildings.duration,
					);

					if (numChunks > 0) {
						const toBuild = {
							res: 0,
							plants: 0,
							rax: 0,
							sm: 0,
							pf: 0,
							tc: 0,
							asb: 0,
							ach: 0,
						};

						let remainingChunks = numChunks;

						while (remainingChunks > 0) {
							let selectedKey: (typeof keys)[number] | null = null;
							let minTargetPct = Infinity;

							for (const key of keys) {
								const currentDef = deficiencies[key] - toBuild[key];
								if (currentDef > 0) {
									const targetPct = buildings.target[key] || 0;
									if (targetPct < minTargetPct) {
										minTargetPct = targetPct;
										selectedKey = key;
									}
								}
							}

							if (!selectedKey) break;

							toBuild[selectedKey] += GAME_PARAMS.buildings.duration;
							remainingChunks--;
						}

						let actualBuiltSum = 0;
						for (const key of keys) {
							actualBuiltSum += toBuild[key];
						}

						if (actualBuiltSum > 0) {
							newKingdom.money -= actualBuiltSum * buildingCost;
							newBuildings.queue = calculateNewQueue(
								newBuildings.queue,
								toBuild,
								GAME_PARAMS.buildings.duration,
							);
							queueChanged = true;
						}
					}
				}
			}
		}
	}

	const newMilitary = {
		...military,
		queue: {
			sol: [...military.queue.sol],
			tr: [...military.queue.tr],
			dr: [...military.queue.dr],
			ft: [...military.queue.ft],
			tf: [...military.queue.tf],
			lt: [...military.queue.lt],
			ld: [...military.queue.ld],
			lf: [...military.queue.lf],
			f74: [...military.queue.f74],
			t: [...military.queue.t],
			hgl: [...military.queue.hgl],
			ht: [...military.queue.ht],
			sci: [...(military.queue.sci || [])],
		},
	};
	let militaryChanged = false;

	const MILITARY_KEYS = [
		"sol",
		"tr",
		"dr",
		"ft",
		"tf",
		"lt",
		"ld",
		"lf",
		"f74",
		"t",
		"hgl",
		"ht",
		"sci",
	] as const;

	if (newMilitary.queue.sol.length > 0) {
		for (const key of MILITARY_KEYS) {
			const completed = newMilitary.queue[key][0] || 0;
			newMilitary[key] += completed;
			newMilitary.queue[key] = newMilitary.queue[key].slice(1);
		}
		militaryChanged = true;
	}

	// Instant conversion/promotion of defensive units if researched
	const isLdResearched = (newKingdom.research.ld?.perc ?? 0) >= 100;
	const isLfResearched = (newKingdom.research.lf?.perc ?? 0) >= 100;

	if (isLdResearched && newMilitary.lt > 0) {
		const ltPoints = newMilitary.lt * 4;
		const ldFromLt = Math.floor(ltPoints / 5);
		const remPointsFromLt = ltPoints % 5;
		newMilitary.lt = 0;
		newMilitary.ld += ldFromLt;
		newMilitary.sol += remPointsFromLt;
		militaryChanged = true;
	}

	if (isLfResearched && newMilitary.ld > 0) {
		const ldPoints = newMilitary.ld * 5;
		const lfFromLd = Math.floor(ldPoints / 6);
		const remPointsFromLd = ldPoints % 6;

		newMilitary.ld = 0;
		newMilitary.lf += lfFromLd;
		newMilitary.sol += remPointsFromLd;
		militaryChanged = true;
	}

	// Instant conversion/promotion of offensive units if researched
	const isDrResearched = (newKingdom.research.dr?.perc ?? 0) >= 100;
	const isFtResearched = (newKingdom.research.ft?.perc ?? 0) >= 100;

	if (isDrResearched && newMilitary.tr > 0) {
		const trPoints = newMilitary.tr * 4;
		const drFromTr = Math.floor(trPoints / 5);
		const remPointsFromTr = trPoints % 5;
		newMilitary.tr = 0;
		newMilitary.dr += drFromTr;
		newMilitary.sol += remPointsFromTr;
		militaryChanged = true;
	}

	if (isFtResearched && newMilitary.dr > 0) {
		const drPoints = newMilitary.dr * 5;
		const ftFromDr = Math.floor(drPoints / 6);
		const remPointsFromDr = drPoints % 6;

		newMilitary.dr = 0;
		newMilitary.ft += ftFromDr;
		newMilitary.sol += remPointsFromDr;
		militaryChanged = true;
	}

	// Auto Assign Research Points
	const autoAssign = kingdom.researchAutoAssign || [];
	if (autoAssign.length > 0 && newKingdom.researchPts > 0) {
		for (const key of autoAssign) {
			if (newKingdom.researchPts <= 0) break;

			const researchKey = key as keyof typeof newKingdom.research;
			const currentPts = newKingdom.research[researchKey]?.pts ?? 0;

			let required = 0;
			const techInfo =
				GAME_PARAMS.militaryTechTree[
					researchKey as keyof typeof GAME_PARAMS.militaryTechTree
				];
			if (techInfo) {
				// Prerequisite check for military research
				if (techInfo.requires) {
					const prerequisite = (
						newKingdom.research as Record<string, { pts: number; perc: number }>
					)[techInfo.requires];
					if (!prerequisite || (prerequisite.perc ?? 0) < 100) continue; // Skip if prerequisite not completed
				}
				required = techInfo.requirePoints;
			} else {
				// Standard bonus research
				const prerequisiteKey = (
					GAME_PARAMS.research.params as Record<string, { requires?: string }>
				)[researchKey]?.requires;
				if (prerequisiteKey) {
					const prerequisite = (
						newKingdom.research as Record<string, { pts: number; perc: number }>
					)[prerequisiteKey];
					if (!prerequisite || (prerequisite.perc ?? 0) < 100) continue; // Skip if prerequisite not completed
				}
				required = GAME_PARAMS.research.required(
					researchKey as keyof typeof GAME_PARAMS.research.params,
					newKingdom.land,
				);
			}

			const needed = Math.max(0, required - currentPts);

			if (needed > 0) {
				const toAssign = Math.min(newKingdom.researchPts, needed);
				const existing = newKingdom.research[researchKey] || {
					pts: 0,
					perc: 0,
				};
				newKingdom.research[researchKey] = {
					...existing,
					pts: existing.pts + toAssign,
				};
				newKingdom.researchPts -= toAssign;
			}
		}
	}

	// Recalculate Research Percentages
	const standardResearchKeys = [
		"pop",
		"power",
		"mil",
		"money",
		"fdc",
		"warp",
	] as const;
	for (const key of standardResearchKeys) {
		const pts = newKingdom.research[key].pts;
		const required = GAME_PARAMS.research.required(key, newKingdom.land);
		const maxBonus = GAME_PARAMS.research.params[key].bonus;
		let perc = 0;
		if (required > 0) {
			perc = Math.min(Math.floor((maxBonus * pts) / required), maxBonus);
		}
		newKingdom.research[key] = { pts, perc };
	}

	const techResearchKeys = [
		"dr",
		"ft",
		"tf",
		"ld",
		"lf",
		"f74",
		"hgl",
		"ht",
		"fusion",
		"core",
		"warp",
		"armor",
		"long",
	] as const;
	for (const key of techResearchKeys) {
		const researchData = (
			newKingdom.research as Record<string, { pts: number; perc: number }>
		)[key];
		const pts = researchData?.pts ?? 0;
		const techInfo =
			GAME_PARAMS.militaryTechTree[
				key as keyof typeof GAME_PARAMS.militaryTechTree
			];
		if (!techInfo) continue;

		const required = techInfo.requirePoints;
		let perc = 0;
		if (required > 0) {
			perc = Math.min(Math.floor((pts / required) * 100), 100);
		}
		(newKingdom.research as Record<string, { pts: number; perc: number }>)[
			key
		] = { pts, perc };
	}

	return {
		updatedKingdom:
			kingdomChanged || moneyIncome !== 0 || powerIncome !== 0
				? newKingdom
				: newKingdom,
		updatedBuildings: queueChanged ? newBuildings : null,
		updatedMilitary: militaryChanged ? newMilitary : null,
		kingdomChanged: kingdomChanged,
	};
}
