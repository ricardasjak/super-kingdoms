import type {
	BuildingConfig,
	BuildingType,
	MilitaryUnitConfig,
	MilitaryUnitType,
	ResearchKey,
	ResearchTechConfig,
	ResearchTechType,
	ResearchTopicType,
} from "../types/game";

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

const MILITARY_UNITS: Record<MilitaryUnitType, MilitaryUnitConfig> = {
	sol: { cost: 150, sol: 0, power: 0.7, housing: 1, off: 1, def: 1 },
	sci: { cost: 1000, sol: 1, power: 0.7, housing: 1, off: 0, def: 0 },
	tr: { cost: 350, sol: 1, power: 0.7, housing: 1, off: 4, def: 0 },
	dr: {
		cost: 450,
		sol: 1,
		power: 0.7,
		housing: 1,
		off: 5,
		def: 0,
		researchRequired: "r_dr",
	},
	ft: {
		cost: 550,
		sol: 1,
		power: 0.7,
		housing: 1,
		off: 6,
		def: 0,
		buildingRequired: "asb",
		researchRequired: "r_ft",
	},
	tf: {
		cost: 1500,
		sol: 0,
		power: 1.4,
		housing: 2,
		off: 12,
		def: 0,
		buildingRequired: "asb",
		researchRequired: "r_tf",
	},
	lt: { cost: 375, sol: 1, power: 0.7, housing: 1, off: 0, def: 4 },
	ld: {
		cost: 500,
		sol: 1,
		power: 0.7,
		housing: 1,
		off: 0,
		def: 5,
		researchRequired: "r_ld",
	},
	lf: {
		cost: 625,
		sol: 1,
		power: 0.7,
		housing: 1,
		off: 0,
		def: 6,
		researchRequired: "r_lf",
	},
	f74: {
		cost: 975,
		sol: 0,
		power: 1.4,
		housing: 1,
		off: 0,
		def: 8,
		buildingRequired: "asb",
		researchRequired: "r_f74",
	},
	t: { cost: 1750, sol: 1, power: 1.4, housing: 2, off: 9, def: 9 },
	ht: {
		cost: 2250,
		sol: 1,
		power: 1.4,
		housing: 2,
		off: 12,
		def: 12,
		researchRequired: "r_ht",
	},
} as const satisfies Record<MilitaryUnitType, MilitaryUnitConfig>;

export const RESEARCH_PARAMS = {
	pop: { weight: 0.00475, bonus: 20, requires: undefined },
	power: { weight: 0.00311, bonus: 50, requires: undefined },
	mil: { weight: 0.00291, bonus: 30, requires: undefined },
	money: { weight: 0.00535, bonus: 25, requires: undefined },
	fdc: { weight: 0.0004, bonus: 25, requires: undefined },
	warp: { weight: 0.00173, bonus: 20, requires: "r_core" as ResearchKey },
} as const satisfies Record<
	ResearchTopicType,
	{ weight: number; bonus: number; requires?: ResearchKey }
>;

const RESEARCH_TECH_TREE: Record<ResearchTechType, ResearchTechConfig> = {
	r_dr: { requirePoints: 60_000 },
	r_ft: { requirePoints: 120_000, requires: "r_dr" },
	r_tf: { requirePoints: 3000, requires: "r_ft" },
	r_f74: { requirePoints: 2000 },

	r_ld: { requirePoints: 72_000 },
	r_lf: { requirePoints: 150_000, requires: "r_ld" },
	r_ht: { requirePoints: 200_000 },

	r_fusion: { requirePoints: 30_000, bonus: 50 },
	r_core: { requirePoints: 50_000, requires: "r_fusion", bonus: 20 },
	r_armor: { requirePoints: 92_000 },
	r_long: { requirePoints: 400_000, requires: "r_core", bonus: 5 },
};

export const BUILDINGS_LIST: Record<BuildingType, BuildingConfig> = {
	res: { label: "Residencies" },
	plants: { label: "Power Plants" },
	rax: { label: "Barracks" },
	sm: { label: "Star Mines" },
	pf: { label: "Probe Factories" },
	tc: { label: "Training Camps" },
	asb: { label: "Air Support Bays", researchRequired: "r_f74" },
};

export const GAME_PARAMS = {
	roundLength: 960,
	buildingsTypes: BUILDINGS_LIST,
	income: {
		population: 2,
		sm: 140,
	},
	population: {
		growth: 0.05,
		decline: (pop: number, land: number) =>
			Math.round(
				Math.max(100, land > 10_000 ? land / 10 : land / 5, pop * 0.05),
			),
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
		cost: (land: number) => Math.sqrt(land) * 111,
		levelMultipliers: [0.165, 0.33, 0.5, 0.67, 0.835, 1, 1.25, 1.5, 1.75, 2],
		landLevelMultipliers: {
			1000: 0.25,
			2500: 0.5,
			5000: 0.75,
		},
	},
	buildings: {
		duration: 16,
		cost: (land: number) => Math.round(Math.sqrt(land) * 63),
		resCapacity: 50,
		raxCapacity: 75,
		asbCapacity: 60,
		achCapacity: 0, // disabled
		plantProduction: 100,
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
	research: {
		params: RESEARCH_PARAMS,
		/**
		 * calculates land based research required points
		 */
		required: (property: ResearchTopicType, land: number) =>
			Math.round(land * land * RESEARCH_PARAMS[property].weight),
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
	bots: {
		limitPerKingdom: 5,
	},
} as const;
