import { describe, expect, it } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";
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

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
		);

		// Check money income
		expect(updatedKingdom.moneyIncome).toBe(2700);
		expect(updatedKingdom.money).toBe(7700);

		const expectedPowerIncome = Math.round(
			buildings.plants * GAME_PARAMS.buildings.plant_production -
				(kingdom.population * GAME_PARAMS.power.consumption.population +
					kingdom.scientists * GAME_PARAMS.power.consumption.scientists +
					kingdom.soldiers * GAME_PARAMS.power.consumption.soldiers),
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

		const { updatedKingdom, updatedBuildings } = processKingdomTick(
			kingdom,
			buildings,
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
});
