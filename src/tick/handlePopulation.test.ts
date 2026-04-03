import { expect, test } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
import { handlePopulation } from "./handlePopulation";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "./types";

test("handlePopulation calculates growth under housing limit", () => {
	const resCount = 100;
	const kingdom: KingdomSettings = {
		population: 1000,
		land: 1000,
		money: 0,
		power: 0,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
		researchPts: 0,
		research: {
			pop: { pts: 0, perc: 20 }, // 20% bonus
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const buildings: BuildingState = {
		res: resCount,
		plants: 0,
		rax: 10,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
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

	const military: MilitaryUnits = {
		sol: 1000, // Occupies barracks space
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
		queue: {
			sol: [],
			tr: [],
			dr: [],
			ft: [],
			tf: [],
			lt: [],
			ld: [],
			lf: [],
			f74: [],
			t: [],
			ht: [],
			sci: [],
		},
	};

	const result = handlePopulation(kingdom, buildings, military);

	// Max capacity: resCount * 50 * 1.2 - (1000 * 1 - 10 * 75)
	const capWithoutRax = resCount * GAME_PARAMS.buildings.resCapacity * 1.2;
	const raxUsage = 1000 * 1;
	const raxCap = 10 * GAME_PARAMS.buildings.raxCapacity;
	const raxSurplus = Math.max(0, raxUsage - raxCap);
	const maxPop = Math.floor(capWithoutRax - raxSurplus);

	const expectedGrowth = Math.min(
		Math.ceil(1000 * GAME_PARAMS.population.growth),
		maxPop - 1000,
	);
	expect(result.popChange).toBe(expectedGrowth);
	expect(result.population).toBe(1000 + expectedGrowth);
});

test("handlePopulation handles decline when overpopulated", () => {
	const kingdom: KingdomSettings = {
		population: 10000,
		land: 500,
		money: 0,
		power: 0,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
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
		plants: 0,
		rax: 0,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
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

	const military: MilitaryUnits = {
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
		queue: {
			sol: [],
			tr: [],
			dr: [],
			ft: [],
			tf: [],
			lt: [],
			ld: [],
			lf: [],
			f74: [],
			t: [],
			ht: [],
			sci: [],
		},
	};

	const result = handlePopulation(kingdom, buildings, military);

	const expectedDeclineCost = GAME_PARAMS.population.decline(10000, 500);
	expect(result.popChange).toBe(-expectedDeclineCost);
});
