import { expect, test } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
import { handleEconomics } from "./handleEconomics";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "./types";

test("handleEconomics calculates money income correctly with bonus", () => {
	const smCount = 100;
	const population = 5000;
	const kingdom: KingdomSettings = {
		population,
		land: 1000,
		money: 0,
		power: 0,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
		researchPts: 0,
		research: {
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 25 }, // 25% bonus
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const buildings: BuildingState = {
		res: 0,
		plants: 0,
		rax: 0,
		sm: smCount,
		pf: 10,
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

	const result = handleEconomics(kingdom, buildings, military);

	const baseIncome =
		smCount * GAME_PARAMS.income.sm +
		population * GAME_PARAMS.income.population;
	const expectedIncome = Math.round(baseIncome * 1.25);

	expect(result.moneyIncome).toBe(expectedIncome);
	expect(result.money).toBe(expectedIncome);
	expect(result.probes).toBe(10); // From pf buildings
});

test("handleEconomics calculates power balance and caps storage", () => {
	const plants = 10;
	const kingdom: KingdomSettings = {
		population: 1000,
		land: 1000,
		money: 0,
		power: 500, // Starting power
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
		researchPts: 0,
		research: {
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 10 }, // 10% bonus
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const buildings: BuildingState = {
		res: 0,
		plants,
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
		sol: 500,
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

	const result = handleEconomics(kingdom, buildings, military);

	const prod = plants * GAME_PARAMS.buildings.plantProduction * 1.1;
	const cons =
		1000 * GAME_PARAMS.power.consumption.population +
		500 * GAME_PARAMS.military.units.sol.power;
	const net = Math.round(prod - cons);

	expect(result.powerIncome).toBe(net);
	const expectedPower = Math.min(
		GAME_PARAMS.buildings.plantStorage * plants,
		Math.max(0, 500 + net),
	);
	expect(result.power).toBe(expectedPower);
});
