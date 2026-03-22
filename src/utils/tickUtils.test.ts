import { describe, expect, it } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
import { processKingdomTick } from "./tickUtils";

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
			queue: { sol: [], tr: [], dr: [], ft: [], tf: [], lt: [], ld: [], lf: [], f74: [], t: [], hgl: [], ht: [], sci: [] },
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
});
