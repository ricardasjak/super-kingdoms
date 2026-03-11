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
	power: {
		production: {
			plants: 140,
		},
		consumption: {
			population: 0.032,
			scientists: 0.7,
			soldiers: 0.7,
		},
		storage: {
			plants: 1000,
		},
	},
	explore: {
		duration: 24,
		cost: (land: number) => Math.round(Math.sqrt(land) * 111),
	},
	buildings: {
		duration: 16,
		cost: (land: number) => Math.round(Math.sqrt(land) * 63),
	},
} as const;
