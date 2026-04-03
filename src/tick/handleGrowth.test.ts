import { expect, test } from "vitest";
import { handleGrowth } from "./handleGrowth";
import type { BuildingState, KingdomSettings } from "./types";

test("handleGrowth completes exploration and buildings from queue", () => {
	const kingdom: KingdomSettings = {
		population: 1000,
		land: 500,
		money: 10000,
		power: 0,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [48, 24], // 48 land completing this tick, 24 land remaining
		researchPts: 0,
		research: {
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const buildings: BuildingState = {
		res: 10,
		plants: 5,
		rax: 5,
		sm: 5,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
		queue: {
			res: [4], // 4 res completing this tick
			plants: [],
			rax: [],
			sm: [],
			pf: [],
			tc: [],
			asb: [],
			ach: [],
		},
	};

	const result = handleGrowth(kingdom, buildings);

	expect(result.updatedKingdom.land).toBe(548);
	expect(result.updatedKingdom.landQueue).toEqual([24]);
	expect(result.updatedBuildings.res).toBe(14);
	expect(result.updatedBuildings.queue.res).toEqual([]);
	expect(result.kingdomChanged).toBe(true);
	expect(result.queueChanged).toBe(true);
});

test("handleGrowth handles auto-explore and auto-build when money available", () => {
	const kingdom: KingdomSettings = {
		population: 1000,
		land: 500,
		money: 1000000,
		power: 0,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
		autoExplore: 10, // 10% auto-explore
		autoBuild: true,
		researchPts: 0,
		research: {
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const buildings: BuildingState = {
		res: 10,
		plants: 5,
		rax: 5,
		sm: 5,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
		target: {
			res: 50, // 50% res target
			plants: 0,
			rax: 0,
			sm: 0,
			pf: 0,
			tc: 0,
			asb: 0,
			ach: 0,
		},
		queue: {
			res: [],
			plants: [],
			rax: [],
			sm: [],
			pf: [],
			tc: [],
			asb: [],
			ach: [],
		},
	};

	const result = handleGrowth(kingdom, buildings);

	// Auto-explore 10% of 500 land = 50. Rounded to duration 24 = 48.
	// Note: 1 tick of exploration completes immediately (2 land), leaving 46 in queue.
	const landQueueSum = result.updatedKingdom.landQueue.reduce(
		(a, b) => a + b,
		0,
	);
	expect(landQueueSum).toBe(46);
	expect(result.kingdomChanged).toBe(true);

	// Auto-build res. There is free land (500 land - 25 buildings = 475 free).
	// Target 50% = 250 res. Current 10. Deficiency 240.
	// Cost and money should be deducted.
	expect(result.updatedBuildings.queue.res.length).toBeGreaterThan(0);
	expect(result.queueChanged).toBe(true);
});
