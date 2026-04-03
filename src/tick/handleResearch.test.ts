import { expect, test } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
import { handleResearch } from "./handleResearch";
import type { KingdomSettings, MilitaryUnits } from "./types";

test("handleResearch adds points and updates percentages", () => {
	const kingdom: KingdomSettings = {
		population: 2250,
		land: 250,
		money: 10000,
		power: 1000,
		probes: 0,
		moneyIncome: 0,
		powerIncome: 0,
		landQueue: [],
		researchPts: 1000,
		researchAutoAssign: ["money"],
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
		sci: 500, // Produces 500 points
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

	const result = handleResearch(kingdom, military);

	// Initial 1000 pts + 500 from sci = 1500 total points
	// Required for money at 250 land is ~334.
	// So 1500 is more than enough to max money (25%)
	expect(result.research.money.pts).toBe(
		GAME_PARAMS.research.required("money", 250),
	);
	expect(result.research.money.perc).toBe(25);

	// Check remaining points
	const expectedUsed = GAME_PARAMS.research.required("money", 250);
	expect(result.researchPts).toBe(1500 - expectedUsed);
});
