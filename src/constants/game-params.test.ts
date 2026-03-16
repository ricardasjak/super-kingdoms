import { describe, expect, it } from "vitest";
import { GAME_PARAMS } from "../constants/game-params";

describe("calculateMaxOffPotential", () => {
	it("should return 0 for empty military", () => {
		const military: Record<string, number> = {
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
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(0);
	});

	it("should calculate offensive potential for troopers", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 100,
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
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			100 * 4,
		);
	});

	it("should calculate offensive potential for dragoons", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 0,
			dr: 50,
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
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			50 * 5,
		);
	});

	it("should calculate offensive potential for fighters", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 0,
			dr: 0,
			ft: 25,
			tf: 0,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 0,
			hgl: 0,
			ht: 0,
			sci: 0,
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			25 * 6,
		);
	});

	it("should calculate offensive potential for tactical fighters", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 0,
			dr: 0,
			ft: 0,
			tf: 10,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 0,
			hgl: 0,
			ht: 0,
			sci: 0,
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			10 * 12,
		);
	});

	it("should calculate offensive potential for tanks", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 0,
			dr: 0,
			ft: 0,
			tf: 0,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 20,
			hgl: 0,
			ht: 0,
			sci: 0,
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			20 * 9,
		);
	});

	it("should calculate offensive potential for hover tanks", () => {
		const military: Record<string, number> = {
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
			ht: 5,
			sci: 0,
		};
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			5 * 12,
		);
	});

	it("should ignore units with no offensive strength", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 0,
			dr: 0,
			ft: 0,
			tf: 0,
			lt: 50,
			ld: 30,
			lf: 20,
			f74: 10,
			t: 0,
			hgl: 0,
			ht: 0,
			sci: 0,
		};
		const result = GAME_PARAMS.military.calculateMaxOffPotential(military);
		expect(result).toBe(0);
	});

	it("should calculate combined offensive potential for multiple units", () => {
		const military: Record<string, number> = {
			sol: 0,
			tr: 100,
			dr: 50,
			ft: 25,
			tf: 10,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 20,
			hgl: 0,
			ht: 5,
			sci: 0,
		};
		const expected = 100 * 4 + 50 * 5 + 25 * 6 + 10 * 12 + 20 * 9 + 5 * 12;
		expect(GAME_PARAMS.military.calculateMaxOffPotential(military)).toBe(
			expected,
		);
	});
});
