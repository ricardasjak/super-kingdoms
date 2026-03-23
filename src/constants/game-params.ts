export const PLANET_TYPES = [
	"Mountainous",
	"Forest and Wilderness",
	"Herbal Jungle",
	"Terra Form",
	"Mystical Lands",
	"Volcanic Inferno",
	"Jagged Tundra",
	"Oceanic",
	"Desert Wasteland",
	"Ice Giant",
	"Shadow Lands",
	"Multiple Terrain",
	"Helium",
	"Eternal Plains",
] as const;

export const RACE_TYPES = [
	"Ancients",
	"Terran",
	"Xivornai",
	"Gistrami",
	"Mafielven",
	"Qanut",
	"Shadow",
] as const;

const MILITARY_UNITS = {
	sol: { cost: 150, power: 0.7, housing: 1, off: 1, def: 1 },
	sci: { cost: 1000, power: 0.7, housing: 1, off: 0, def: 0 },
	tr: { cost: 350, power: 0.7, housing: 1, off: 4, def: 0 },
	dr: { cost: 450, power: 0.7, housing: 1, off: 5, def: 0 },
	ft: { cost: 550, power: 0.7, housing: 1, off: 6, def: 0 },
	tf: {
		cost: 1500,
		power: 1.4,
		housing: 1,
		off: 12,
		def: 0,
		requiresBuilding: "asb",
	},
	lt: { cost: 375, power: 0.7, housing: 1, off: 0, def: 4 },
	ld: { cost: 500, power: 0.7, housing: 1, off: 0, def: 5 },
	lf: { cost: 625, power: 0.7, housing: 1, off: 0, def: 6 },
	f74: {
		cost: 975,
		power: 1.4,
		housing: 1,
		off: 0,
		def: 8,
		requiresBuilding: "ach",
	},
	t: { cost: 1750, power: 1.4, housing: 2, off: 9, def: 9 },
	hgl: { cost: 1000, power: 0.7, housing: 1, off: 6, def: 6 },
	ht: { cost: 2250, power: 1.4, housing: 2, off: 12, def: 12 },
} as const;

export const RESEARCH_WEIGHTS = {
	pop: 0.00475,
	power: 0.00311,
	mil: 0.00291,
	money: 0.00535,
	fdc: 0.0004,
	warp: 0.00173,
} as const;

export const RESEARCH_BONUS = {
	pop: 20,
	power: 50,
	mil: 30,
	money: 25,
	fdc: 25,
	warp: 20,
} as const;

export const RESEARCH_PREREQUISITES: Partial<
	Record<keyof typeof RESEARCH_WEIGHTS, string>
> = {
	warp: "core",
};

const RESEARCH_TECH_TREE: Partial<
	Record<string, { requirePoints: number; requires?: string; building?: string, bonus?: number }>
> = {
	dr: { requirePoints: 60_000 },
	ft: { requirePoints: 120_000, requires: "dr" },
	tf: { requirePoints: 480_000, requires: "ft", building: "asb" },

	ld: { requirePoints: 72_000 },
	lf: { requirePoints: 150_000, requires: "ld" },
	f74: { requirePoints: 600_000, requires: "lf", building: "ach" },

	hgl: { requirePoints: 100_000 },
	ht: { requirePoints: 200_000, requires: "hgl" },

	fusion: { requirePoints: 30_000, bonus: 50 },
	core: { requirePoints: 50_000, requires: "fusion", bonus: 20 },
	armor: { requirePoints: 92_000},
};

export const GAME_PARAMS = {
	roundLength: 480,
	income: {
		population: 2,
		sm: 140,
	},
	population: {
		growth: 0.05,
		decline: (pop: number, land: number) =>
			Math.round(Math.max(land / 5, pop * 0.05)),
	},
	power: {
		consumption: {
			population: 0.032,
			scientists: 0.7,
			soldiers: 0.7,
		},
	},
	explore: {
		duration: 24,
		limit: 0.1,
		cost: (land: number) => Math.round(Math.sqrt(land) * 111),
	},
	buildings: {
		duration: 16,
		cost: (land: number) => Math.round(Math.sqrt(land) * 63),
		resCapacity: 50,
		raxCapacity: 75,
		asbCapacity: 40,
		achCapacity: 60,
		plantProduction: 140,
		plantStorage: 1000,
	},
	military: {
		calculateTcDiscount: (tcCount: number, land: number) => {
			if (land <= 0) return 0;
			const ratio = tcCount / land;
			return Math.min(30, Math.floor(ratio * 300));
		},
		duration: 24,
		soldierDuration: 16,
		soldiersLimit: 0.1,
		units: MILITARY_UNITS,
		calculateMaxDefPotential: (military: Record<string, number>) => {
			const units = GAME_PARAMS.military.units;
			let total = 0;
			for (const [unit, count] of Object.entries(military)) {
				const unitDef = units[unit as keyof typeof units]?.def ?? 0;
				total += unitDef * count;
			}
			return total;
		},
		calculateMaxOffPotential: (military: Record<string, number>) => {
			const units = GAME_PARAMS.military.units;
			let total = 0;
			for (const [unit, count] of Object.entries(military)) {
				const unitOff = units[unit as keyof typeof units]?.off ?? 0;
				total += unitOff * count;
			}
			return total;
		},
		calculateMinDefPotential: (military: Record<string, number>) => {
			const units = GAME_PARAMS.military.units;
			let total = 0;
			const pureDefUnits = ["lt", "ld", "lf", "f74"];
			for (const [unit, count] of Object.entries(military)) {
				if (pureDefUnits.includes(unit)) {
					const unitDef = units[unit as keyof typeof units]?.def ?? 0;
					total += unitDef * count;
				}
			}
			return total;
		},
	},
	militaryTechTree: RESEARCH_TECH_TREE,
	researchPrerequisites: RESEARCH_PREREQUISITES,
	research: {
		weights: RESEARCH_WEIGHTS,
		bonuses: RESEARCH_BONUS,
		/**
		 * calculates land based research required points
		 */
		required: (property: keyof typeof RESEARCH_WEIGHTS, land: number) =>
			Math.round(land * land * RESEARCH_WEIGHTS[property]),
	},
	nw: {
		units: {
			sol: 3,
			tr: 6,
			dr: 8,
			ft: 10,
			tf: 18,
			lt: 6,
			ld: 8,
			lf: 10,
			f74: 12,
			t: 22,
			hgl: 15,
			ht: 31,
			sci: 8,
		},
		land: 25,
		buildings: 25,
		population: 1,
		money: 500,
		probes: 1000,
	},
} as const;
