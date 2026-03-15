import { GAME_PARAMS } from "../constants/game-params";
import { calculateFreeLand, calculateNewQueue } from "./buildingUtils";
import { calculateExplorationQueue } from "./landUtils";

type MilitaryUnits = {
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

export function processKingdomTick(
	kingdom: {
		population: number;
		land: number;
		money: number;
		power: number;
		probes: number;
		moneyIncome: number;
		powerIncome: number;
		landQueue: number[];
		autoExplore?: boolean;
		autoBuild?: boolean;
	},
	buildings: {
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
	},
	military: MilitaryUnits,
) {
	const moneyIncome =
		buildings.sm * GAME_PARAMS.income.sm +
		kingdom.population * GAME_PARAMS.income.population;
	const powerConsumption =
		kingdom.population * GAME_PARAMS.power.consumption.population +
		military.sci * GAME_PARAMS.power.consumption.scientists +
		military.sol * GAME_PARAMS.power.consumption.soldiers;
	const powerIncome =
		buildings.plants * GAME_PARAMS.buildings.plantProduction - powerConsumption;

	const maxPopulation = buildings.res * GAME_PARAMS.buildings.resCapacity;
	let populationChange = 0;
	if (kingdom.population < maxPopulation) {
		populationChange = Math.ceil(
			kingdom.population * GAME_PARAMS.population.growth,
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
		population: Math.max(0, kingdom.population + populationChange),
		popChange: populationChange,
		power: Math.min(
			GAME_PARAMS.buildings.plantStorage * buildings.plants,
			Math.max(0, Math.round(kingdom.power + powerIncome)),
		),
		probes: kingdom.probes + buildings.pf,
		moneyIncome: Math.round(moneyIncome),
		powerIncome: Math.round(powerIncome),
		land: kingdom.land,
		landQueue: [...kingdom.landQueue],
	};

	let kingdomChanged = false;
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
					let remainingToBuild = Math.min(maxToBuild, totalDeficiency);
					const totalWillBuild = remainingToBuild;

					for (const key of keys) {
						if (deficiencies[key] > 0) {
							const proportion = Math.floor(
								(deficiencies[key] / totalDeficiency) * totalWillBuild,
							);
							toBuild[key] = proportion;
							remainingToBuild -= proportion;
						}
					}

					while (remainingToBuild > 0) {
						for (const key of keys) {
							if (remainingToBuild > 0 && deficiencies[key] > toBuild[key]) {
								toBuild[key]++;
								remainingToBuild--;
							}
						}
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

	if (newKingdom.autoExplore) {
		const currentQueueSum = newKingdom.landQueue.reduce((a, b) => a + b, 0);
		const maxPossibleExplore = Math.floor(
			newKingdom.land * GAME_PARAMS.explore.limit,
		);
		const maxExplore = Math.max(0, maxPossibleExplore - currentQueueSum);

		if (maxExplore > 0) {
			const costPerLand = GAME_PARAMS.explore.cost(newKingdom.land);
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
