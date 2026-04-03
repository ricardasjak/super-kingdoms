import { expect, test } from "vitest";
import type { BuildingType } from "../../types/game";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "../types";
import { handleAutoGrowth } from "./handleAutoGrowth";

test("handleAutoGrowth handles exploration and buildings together", () => {
	const buildKeys: BuildingType[] = ["res"];
	const kingdom: Pick<
		KingdomSettings,
		| "autoBuild"
		| "autoExplore"
		| "land"
		| "money"
		| "landQueue"
		| "population"
		| "research"
	> = {
		autoBuild: true,
		autoExplore: 10,
		land: 1000,
		money: 1000000,
		landQueue: [],
		population: 5000,
		research: {} as KingdomSettings["research"],
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
		target: {
			res: 50, // 500 res target. Current 10.
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

	const result = handleAutoGrowth(kingdom, buildings, buildKeys);

	expect(result.changed).toBe(true);

	// Explore 10% of 1000 = 100. Rounded to 24 = 96.
	const exploreQueued = result.landQueue.reduce((a, b) => a + b, 0);
	expect(exploreQueued).toBe(96);

	// Build res
	const resQueued = result.buildingQueue.res.reduce((a, b) => a + b, 0);
	expect(resQueued).toBeGreaterThan(0);

	expect(result.money).toBeLessThan(1000000);
});

test("handleAutoGrowth is limited by money across both actions", () => {
	const buildKeys: BuildingType[] = ["res"];
	const kingdom: Pick<
		KingdomSettings,
		| "autoBuild"
		| "autoExplore"
		| "land"
		| "money"
		| "landQueue"
		| "population"
		| "research"
	> = {
		autoBuild: true,
		autoExplore: 10,
		land: 1000,
		money: 0, // No money
		landQueue: [],
		population: 5000,
		research: {} as KingdomSettings["research"],
	};

	const buildings: BuildingState = {
		res: 0,
		plants: 0,
		rax: 0,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
		target: { res: 10, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0 },
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

	const result = handleAutoGrowth(kingdom, buildings, buildKeys);
	expect(result.changed).toBe(false);
	expect(result.money).toBe(0);
});

test("handleAutoGrowth respects autoBuild and autoExplore toggles", () => {
	const buildKeys: BuildingType[] = ["res"];
	const kingdom: Pick<
		KingdomSettings,
		| "autoBuild"
		| "autoExplore"
		| "land"
		| "money"
		| "landQueue"
		| "population"
		| "research"
	> = {
		autoBuild: false,
		autoExplore: 0,
		land: 1000,
		money: 1000000,
		landQueue: [],
		population: 5000,
		research: {} as KingdomSettings["research"],
	};

	const buildings: BuildingState = {
		res: 0,
		plants: 0,
		rax: 0,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
		target: {
			res: 100,
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

	const result = handleAutoGrowth(kingdom, buildings, buildKeys);
	expect(result.changed).toBe(false);
});

test("handleAutoGrowth handles military training and production", () => {
	const buildKeys: BuildingType[] = [];
	const kingdom: Pick<
		KingdomSettings,
		| "autoBuild"
		| "autoExplore"
		| "land"
		| "money"
		| "landQueue"
		| "population"
		| "research"
	> = {
		autoBuild: true,
		autoExplore: 0,
		land: 1000,
		money: 1000000,
		landQueue: [],
		population: 100000,
		research: {
			r_dr: { pts: 10000, perc: 100 },
		} as KingdomSettings["research"],
	};

	const buildings: BuildingState = {
		res: 0,
		plants: 0,
		rax: 0,
		sm: 0,
		pf: 0,
		tc: 0,
		asb: 0,
		ach: 0,
		rubble: 0,
		target: { res: 0, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0 },
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
		sol: 1000,
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
		target: {
			sol: 0,
			tr: 0,
			dr: 10,
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
	};

	const result = handleAutoGrowth(kingdom, buildings, buildKeys, military);

	expect(result.changed).toBe(true);

	// 1. Buy Soldiers
	// Population 100,000 * 0.1 = 10,000 (training limit)
	// Land 1,000 * 4 = 4,000 (bot limit)
	// Target total soldiers = 4000
	// Starting total = 1000. Need 3,000.
	// Rounded to 16: floor(3000 / 16) * 16 = 2992 soldiers.
	const solQueued = result.militaryQueue?.sol.reduce(
		(a, b: number) => a + b,
		0,
	);
	expect(solQueued).toBe(2992);

	// 2. Production
	// Money after solar buy: 1,000,000 - (2992 * 150) = 551,200
	// DR Target 10%: 55,120 budget
	// Soldier budget for DR (10% of 1000): 100
	// DR Cost: 450 (no TC discount)
	// Max DR by money: 55120 / 450 = 122
	// Max DR by soldiers: 100 / 1 = 100
	// Batching 24: floor(100 / 24) * 24 = 96
	const drQueued = result.militaryQueue?.dr.reduce((a, b: number) => a + b, 0);
	expect(drQueued).toBe(96);

	// militarySol should be 1000 - 96 = 904
	expect(result.militarySol).toBe(904);

	// Final money: 551,200 - (96 * 450) = 551,200 - 43,200 = 508,000
	expect(result.money).toBe(508000);
});
