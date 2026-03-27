import { describe, expect, it } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
import {
	type BuildingState,
	type KingdomSettings,
	type MilitaryUnits,
	processKingdomTick,
} from "./tickUtils";

describe("processKingdomTick", () => {
	it("should correctly calculate money and power income", () => {
		const kingdom = {
			population: 1000,
			land: 200,
			money: 5000,
			power: 1000,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [],
			researchPts: 0,
			research: {
				pop: { pts: 0, perc: 0 },
				power: { pts: 0, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 0, perc: 0 },
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
				dr: { pts: 0, perc: 0 },
				ft: { pts: 0, perc: 0 },
				tf: { pts: 0, perc: 0 },
				ld: { pts: 0, perc: 0 },
				lf: { pts: 0, perc: 0 },
				f74: { pts: 0, perc: 0 },
				hgl: { pts: 0, perc: 0 },
				ht: { pts: 0, perc: 0 },
			},
		};
		const buildings = {
			res: 0,
			sm: 5,
			plants: 10,
			rax: 0,
			pf: 0,
			tc: 0,
			asb: 0,
			ach: 0,
			rubble: 0,
			queue: {
				res: [],
				sm: [],
				plants: [],
				rax: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			},
		};
		const military = {
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
			hgl: 0,
			ht: 0,
			sci: 100,
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
				hgl: [],
				ht: [],
				sci: [],
			},
		};

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
			military,
		);

		// Check money income
		expect(updatedKingdom.moneyIncome).toBe(2700);
		expect(updatedKingdom.money).toBe(7700);

		const expectedPowerIncome = Math.round(
			buildings.plants * GAME_PARAMS.buildings.plantProduction -
				(kingdom.population * GAME_PARAMS.power.consumption.population +
					military.sci * GAME_PARAMS.power.consumption.scientists +
					military.sol * GAME_PARAMS.power.consumption.soldiers),
		);
		expect(updatedKingdom.powerIncome).toBe(expectedPowerIncome);
		expect(updatedKingdom.power).toBe(1000 + expectedPowerIncome);

		expect(updatedBuildings).toBeNull(); // queue didn't change empty queue
	});

	it("should correctly progress the building queue", () => {
		const kingdom = {
			population: 0,
			land: 0,
			money: 0,
			power: 0,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [50],
			researchPts: 0,
			research: {
				pop: { pts: 0, perc: 0 },
				power: { pts: 0, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 0, perc: 0 },
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
				dr: { pts: 0, perc: 0 },
				ft: { pts: 0, perc: 0 },
				tf: { pts: 0, perc: 0 },
				ld: { pts: 0, perc: 0 },
				lf: { pts: 0, perc: 0 },
				f74: { pts: 0, perc: 0 },
				hgl: { pts: 0, perc: 0 },
				ht: { pts: 0, perc: 0 },
			},
		};
		const buildings = {
			res: 5,
			plants: 0,
			rax: 0,
			sm: 0,
			pf: 0,
			tc: 0,
			asb: 0,
			ach: 0,
			rubble: 0,
			queue: {
				res: [10, 20],
				sm: [5],
				plants: [],
				rax: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			},
		};

		const military = {
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
			hgl: 0,
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
				hgl: [],
				ht: [],
				sci: [],
			},
		};

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
			military,
		);

		// Check land queue progressing natively
		expect(updatedKingdom.landQueue).toEqual([]);
		expect(updatedKingdom.land).toBe(50);

		expect(updatedBuildings).not.toBeNull();
		// Res queue 1st element completed
		expect(updatedBuildings?.res).toBe(15);
		expect(updatedBuildings?.queue.res).toEqual([20]);

		// SM queue 1st element completed
		expect(updatedBuildings?.sm).toBe(5);
		expect(updatedBuildings?.queue.sm).toEqual([]);

		// Plants queue unchanged
		expect(updatedBuildings?.plants).toBe(0);
		expect(updatedBuildings?.queue.plants).toEqual([]);
	});

	it("should prioritize auto-building smaller target percentages first", () => {
		const kingdom = {
			population: 0,
			land: 40,
			money: 100000,
			power: 0,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [],
			autoBuild: true,
			researchPts: 0,
			research: {
				pop: { pts: 0, perc: 0 },
				power: { pts: 0, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 0, perc: 0 },
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
				dr: { pts: 0, perc: 0 },
				ft: { pts: 0, perc: 0 },
				tf: { pts: 0, perc: 0 },
				ld: { pts: 0, perc: 0 },
				lf: { pts: 0, perc: 0 },
				f74: { pts: 0, perc: 0 },
				hgl: { pts: 0, perc: 0 },
				ht: { pts: 0, perc: 0 },
			},
		};
		const buildings = {
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
				res: 40,
				plants: 30,
				rax: 20,
				sm: 10,
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
		const military = {
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
			hgl: 0,
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
				hgl: [],
				ht: [],
				sci: [],
			},
		};

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
			military,
		);

		expect(updatedBuildings?.queue.sm).toEqual(Array(16).fill(1));
		expect(updatedBuildings?.queue.rax).toEqual(Array(16).fill(1));
		expect(updatedBuildings?.queue.plants).toEqual(Array(16).fill(0));
		expect(updatedBuildings?.queue.res).toEqual(Array(16).fill(0));
		expect(updatedKingdom.money).toBeLessThan(100000);
	});

	it("should increment researchPts by active scientists and update queue properly", () => {
		const kingdom = {
			population: 0,
			land: 100,
			money: 100000,
			power: 10000,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [],
			researchPts: 500,
			research: {
				pop: { pts: 200000, perc: 0 },
				power: { pts: 15, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 0, perc: 0 },
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
				dr: { pts: 0, perc: 0 },
				ft: { pts: 0, perc: 0 },
				tf: { pts: 0, perc: 0 },
				ld: { pts: 0, perc: 0 },
				lf: { pts: 0, perc: 0 },
				f74: { pts: 0, perc: 0 },
				hgl: { pts: 0, perc: 0 },
				ht: { pts: 0, perc: 0 },
			},
		};
		const buildings = {
			res: 0,
			plants: 0,
			rax: 100,
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
		const military = {
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
			hgl: 0,
			ht: 0,
			sci: 1000,
			queue: {
				sol: [0, 0, 0],
				tr: [0, 0, 0],
				dr: [0, 0, 0],
				ft: [0, 0, 0],
				tf: [0, 0, 0],
				lt: [0, 0, 0],
				ld: [0, 0, 0],
				lf: [0, 0, 0],
				f74: [0, 0, 0],
				t: [0, 0, 0],
				hgl: [0, 0, 0],
				ht: [0, 0, 0],
				sci: [40, 0, 0],
			},
		};

		const { updatedKingdom, updatedMilitary } = processKingdomTick(
			kingdom,
			buildings,
			military,
		);

		expect(updatedKingdom.researchPts).toBe(1500); // 500 existing + 1000 scientists
		expect(updatedMilitary?.sci).toBe(1040); // 1000 + 40 from queue
		expect(updatedMilitary?.queue.sci).toEqual([0, 0]); // Queue progresses

		// Test perc max bonus bounds
		expect(updatedKingdom.research?.pop.perc).toBe(20); // Hits 20 max bonus easily

		// Test perc ratio algorithm
		expect(updatedKingdom.research?.power.perc).toBe(24); // Math.floor( 50 * 15 / 31 ) = 24
	});

	it("should apply money bonus to income", () => {
		const kingdom = {
			population: 1000,
			land: 200,
			money: 5000,
			power: 1000,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [],
			researchPts: 0,
			research: {
				pop: { pts: 0, perc: 0 },
				power: { pts: 0, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 1000, perc: 25 }, // Assume already has bonus
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
				dr: { pts: 0, perc: 0 },
				ft: { pts: 0, perc: 0 },
				tf: { pts: 0, perc: 0 },
				ld: { pts: 0, perc: 0 },
				lf: { pts: 0, perc: 0 },
				f74: { pts: 0, perc: 0 },
				hgl: { pts: 0, perc: 0 },
				ht: { pts: 0, perc: 0 },
			},
		};
		const buildings = {
			res: 0,
			sm: 5,
			plants: 10,
			rax: 0,
			pf: 0,
			tc: 0,
			asb: 0,
			ach: 0,
			rubble: 0,
			queue: {
				res: [],
				sm: [],
				plants: [],
				rax: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			},
		};
		const military = {
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
			hgl: 0,
			ht: 0,
			sci: 100,
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
				hgl: [],
				ht: [],
				sci: [],
			},
		};

		const { updatedKingdom } = processKingdomTick(kingdom, buildings, military);

		// Base income: 5 * 140 + 1000 * 2 = 700 + 2000 = 2700
		// Bonus: 25% (as defined in GAME_PARAMS.research.bonuses.money)
		// Total: 2700 * 1.25 = 3375
		expect(updatedKingdom.moneyIncome).toBe(3375);
		expect(updatedKingdom.research?.money.perc).toBe(25);
	});

	it("should cap auto-exploration at the correct limit (10% of land)", () => {
		const kingdom = {
			population: 2250,
			land: 250,
			money: 300000,
			power: 10000,
			moneyIncome: 0,
			powerIncome: 0,
			probes: 0,
			landQueue: [] as number[],
			autoExplore: 10,
			researchPts: 0,
			research: {
				pop: { pts: 0, perc: 0 },
				power: { pts: 0, perc: 0 },
				mil: { pts: 0, perc: 0 },
				money: { pts: 0, perc: 0 },
				fdc: { pts: 0, perc: 0 },
				warp: { pts: 0, perc: 0 },
			},
		};

		const buildings = {
			res: 80,
			plants: 40,
			rax: 10,
			sm: 30,
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

		const military = {
			sol: 200,
			tr: 0,
			dr: 0,
			ft: 0,
			tf: 0,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 0,
			hgl: 0,
			ht: 0,
			sci: 100,
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
				hgl: [],
				ht: [],
				sci: [],
			},
		};

		const { updatedKingdom } = processKingdomTick(
			kingdom as unknown as KingdomSettings,
			buildings as unknown as BuildingState,
			military as unknown as MilitaryUnits,
		);

		// Since auto-exploration now happens BEFORE the queue progresses in the same tick,
		// 1 piece is added to land and 23 remain in queue (if started with empty queue).
		const queueSum = updatedKingdom.landQueue.reduce((a, b) => a + b, 0);
		expect(queueSum).toBe(23);
		expect(updatedKingdom.land).toBe(251);
	});
});
