export interface Entity {
	id: number;
	created?: string;
	updated?: string;
}

export const PlanetTypes = ['FW', 'Mn', 'Oc', 'VI', 'TF', 'MT', 'JT', 'DW'] as const;
export type PlanetType = (typeof PlanetTypes)[number];
export const RaceTypes = ['Xi', 'Gi', 'Ma', 'Te'] as const;
export type RaceType = (typeof RaceTypes)[number];

export type KingdomState = 'Mobilization' | 'Growth';

export type Error = string | undefined;

export interface KingdomBase {
	userId: number;
	roundId: number;
	nickname: string;
	name: string;
	ruler: string;
	sector: number;
	galaxy: number;
	planet: PlanetType;
	race: RaceType;
	x: number;
	y: number;
}

export interface CreateKingdom {
	name: string;
	ruler: string;
	planet: (typeof PlanetTypes)[number];
	race: (typeof RaceTypes)[number];
}

export type Kingdom = KingdomBase & Entity;

export interface KingdomEntityWithSnapshots extends KingdomBase {
	snapshots: KingdomSnapshot[];
}

// export interface Kingdom extends KingdomEntity {
// 	snapshots: Map<number, KingdomSnapshot>;
// }

export type Buildings = {
	residences: number;
	starMines: number;
	barracks: number;
	powerPlants: number;
	trainingCamps: number;
};

export type UnitType = 'soldiers' | 'lt' | 'tr' | 'dr' | 'ld' | 'tanks' | 'hgl' | 'tf' | 'sci';

export type Military = Record<UnitType, number>;

// export type Military = {
// 	soldiers: number;
// 	lt: number;
// 	tr: number;
// 	dr: number;
// 	ld: number;
// 	tanks: number;
// 	hgl: number;
// 	tf: number;
// 	sci: number;
// };

export type ResearchType = {
	points: number;
	scientists: number;
	percentage: number;
};

export type Research = {
	pop: ResearchType;
	power: ResearchType;
	military: ResearchType;
	money: ResearchType;
};

export type Snapshot = {
	state: KingdomState;
	x: number;
	y: number;
	nw: number;
	land: number;
	money: number;
	buildings: Buildings;
	military: Military;
	research: Research;
	queues: {
		buildings: Buildings[];
		military: Record<UnitType, number[]>;
		land: number[];
	};
};

export type KingdomSnapshot = {
	tick: number;
	kdid: number;
	body: Snapshot;
	created_at?: unknown;
};
