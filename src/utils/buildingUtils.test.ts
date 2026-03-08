import { describe, expect, it } from "vitest";
import { calculateFreeLand, calculateNewQueue } from "./buildingUtils";

describe("buildingUtils", () => {
	describe("calculateFreeLand", () => {
		it("calculates free land correctly with empty queue", () => {
			const buildings = {
				res: 50,
				plants: 10,
				rax: 5,
				sm: 5,
				pf: 0,
				tc: 0,
				asb: 0,
				ach: 0,
				rubble: 0,
			};
			const queue = {
				res: [],
				plants: [],
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			};
			const land = 100;

			// 50 + 10 + 5 + 5 = 70. 100 - 70 = 30.
			expect(calculateFreeLand(land, buildings, queue)).toBe(30);
		});

		it("calculates free land correctly with active queue", () => {
			const buildings = {
				res: 50,
				plants: 10,
				rax: 10,
				sm: 0,
				pf: 0,
				tc: 0,
				asb: 0,
				ach: 0,
				rubble: 5,
			}; // Total = 75
			const queue = {
				res: [1, 1], // 2
				plants: [2], // 2
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			}; // Queue sum = 4

			const land = 100;
			// 100 - 75 - 4 = 21
			expect(calculateFreeLand(land, buildings, queue)).toBe(21);
		});
	});

	describe("calculateNewQueue", () => {
		it("distributes perfectly divisible requested buildings across all ticks", () => {
			const currentQueue = {
				res: [],
				plants: [],
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			};
			const requested = {
				res: 32,
				plants: 0,
				rax: 0,
				sm: 0,
				pf: 0,
				tc: 0,
				asb: 0,
				ach: 0,
			};

			const newQueue = calculateNewQueue(currentQueue, requested, 16);
			// 32 / 16 = 2
			expect(newQueue.res).toEqual(Array(16).fill(2));
		});

		it("distributes remainders starting from the back (e.g. 31 buildings)", () => {
			const currentQueue = {
				res: [],
				plants: [],
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			};
			const requested = {
				res: 31,
				plants: 0,
				rax: 0,
				sm: 0,
				pf: 0,
				tc: 0,
				asb: 0,
				ach: 0,
			};

			const newQueue = calculateNewQueue(currentQueue, requested, 16);
			// math.floor(31/16) = 1. Remainder 15. The first should be 1, the rest (15 of them) should be 2.
			expect(newQueue.res).toEqual([
				1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
			]);
		});

		it("merges requested buildings properly into an existing queue", () => {
			const currentQueue = {
				res: [2, 2],
				plants: [],
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			};
			const requested = {
				res: 16,
				plants: 16,
				rax: 0,
				sm: 0,
				pf: 0,
				tc: 0,
				asb: 0,
				ach: 0,
			};

			const newQueue = calculateNewQueue(currentQueue, requested, 16);
			// Base res was [2, 2]. Padded to 16, that's [2, 2, 0, 0...].
			// Requested 16 res (1 per tick): [3, 3, 1, 1, 1...]
			expect(newQueue.res).toEqual([
				3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
			]);
			expect(newQueue.plants).toEqual(Array(16).fill(1));
		});
	});
});
