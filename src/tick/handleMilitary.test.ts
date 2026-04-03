import { expect, test } from "vitest";
import { handleMilitary } from "./handleMilitary";
import type { KingdomSettings, MilitaryUnits } from "./types";

test("handleMilitary completes units training from queue", () => {
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
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
		},
	};

	const military: MilitaryUnits = {
		sol: 100,
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
			sol: [20], // 20 soldiers completing this tick
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

	const result = handleMilitary(kingdom, military);

	expect(result.updatedMilitary.sol).toBe(120);
	expect(result.updatedMilitary.queue.sol).toEqual([]);
	expect(result.militaryChanged).toBe(true);
});

test("handleMilitary performs instant unit promotions", () => {
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
			pop: { pts: 0, perc: 0 },
			money: { pts: 0, perc: 0 },
			power: { pts: 0, perc: 0 },
			mil: { pts: 0, perc: 0 },
			fdc: { pts: 0, perc: 0 },
			warp: { pts: 0, perc: 0 },
			r_dr: { pts: 10000, perc: 100 }, // DR researched
		},
	};

	const military: MilitaryUnits = {
		sol: 100,
		tr: 10, // These should promote to DR
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

	const result = handleMilitary(kingdom, military);

	// TR (4 points each) -> 10 TR = 40 points
	// DR cost 5 points. 40 / 5 = 8 DR.
	// 0 remainder points (remaining sol)
	expect(result.updatedMilitary.tr).toBe(0);
	expect(result.updatedMilitary.dr).toBe(8);
	expect(result.updatedMilitary.sol).toBe(100);
	expect(result.militaryChanged).toBe(true);
});
