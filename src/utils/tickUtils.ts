export function processKingdomTick(
	kingdom: {
		population: number;
		soldiers: number;
		scientists: number;
		land: number;
		money: number;
		power: number;
		moneyIncome: number;
		powerIncome: number;
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
	const moneyIncome = buildings.sm * 120 + kingdom.population * 2;
	const powerConsumption =
		kingdom.population * 0.32 +
		(kingdom.scientists + kingdom.soldiers) * 0.7 +
		kingdom.land * 50;
	const powerIncome = buildings.plants * 140 - powerConsumption;

	const newKingdom = {
		...kingdom,
		money: kingdom.money + moneyIncome,
		power: Math.round(kingdom.power + powerIncome),
		moneyIncome: Math.round(moneyIncome),
		powerIncome: Math.round(powerIncome),
	};

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
		updatedKingdom: newKingdom,
		updatedBuildings: queueChanged ? newBuildings : null,
	};
}
