import { type PlanetType, type RaceType } from '~/kingdom/kingdom.model';

export const PT_LABEL: Record<PlanetType, string> = {
	Oc: 'Oceanic',
	JT: 'Jagged Tundra',
	VI: 'Volcanic Inferno',
	TF: 'Terra Form',
	MT: 'Multiple Terrain',
	Mn: 'Mountainous',
	FW: 'Forest Wilderness',
	DW: 'Desert Wasteland',
};

export const RACE_LABEL: Record<RaceType, string> = {
	Xi: 'Xivornai',
	Te: 'Terran',
	Ma: 'Mafielven',
	Gi: 'Gistrami',
};
