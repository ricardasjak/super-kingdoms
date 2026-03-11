import { GAME_PARAMS } from "../constants/game-params";

export function processKingdomTick(
	kingdom: {
		population: number;
		soldiers: number;
		scientists: number;
		land: number;
		money: number;
		power: number;
		probes: number;
		moneyIncome: number;
		powerIncome: number;
		landQueue: number[];
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
) {
	const moneyIncome =
		buildings.sm * GAME_PARAMS.income.sm +
		kingdom.population * GAME_PARAMS.income.population;
	const powerConsumption =
		kingdom.population * GAME_PARAMS.power.consumption.population +
		kingdom.scientists * GAME_PARAMS.power.consumption.scientists +
		kingdom.soldiers * GAME_PARAMS.power.consumption.soldiers;
	const powerIncome =
		buildings.plants * GAME_PARAMS.power.production.plants - powerConsumption;

	const newKingdom = {
		...kingdom,
		money: kingdom.money + moneyIncome,
		power: Math.min(
			GAME_PARAMS.power.storage.plants * buildings.plants,
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

	return {
		updatedKingdom:
			kingdomChanged || moneyIncome !== 0 || powerIncome !== 0
				? newKingdom
				: newKingdom,
		updatedBuildings: queueChanged ? newBuildings : null,
		kingdomChanged: kingdomChanged,
	};
}
