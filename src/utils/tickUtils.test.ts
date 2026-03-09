import { describe, expect, it } from "vitest";
import { processKingdomTick } from "./tickUtils";

describe("processKingdomTick", () => {
	it("should correctly calculate money and power income", () => {
		const kingdom = {
			population: 1000,
			soldiers: 100,
			scientists: 100,
			land: 200,
			money: 5000,
			power: 1000,
			moneyIncome: 0,
			powerIncome: 0,
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

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
		);

		// Check money income
		expect(updatedKingdom.moneyIncome).toBe(2600);
		expect(updatedKingdom.money).toBe(7600);

		// Check power consumption: (1000 * 0.32) + (200 * 0.7) + (200 * 50)
		// = 320 + 140 + 10000 = 10460 power consumed
		// produced: 1400. Income: 1400 - 10460 = -9060
		const expectedPowerIncome = Math.round(
			1400 - (1000 * 0.32 + 200 * 0.7 + 200 * 50),
		);
		expect(updatedKingdom.powerIncome).toBe(expectedPowerIncome);
		expect(updatedKingdom.power).toBe(1000 + expectedPowerIncome);

		expect(updatedBuildings).toBeNull(); // queue didn't change empty queue
	});

	it("should correctly progress the building queue", () => {
		const kingdom = {
			population: 0,
			soldiers: 0,
			scientists: 0,
			land: 0,
			money: 0,
			power: 0,
			moneyIncome: 0,
			powerIncome: 0,
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

		const { updatedBuildings } = processKingdomTick(kingdom, buildings);

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
});
