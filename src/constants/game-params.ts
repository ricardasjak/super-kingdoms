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
		residence_cap: 50,
		rax_cap: 75,
		plant_production: 140,
		plant_storage: 1000,
	},
} as const;
