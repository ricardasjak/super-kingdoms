import type { Doc } from "../../convex/_generated/dataModel";

// Single source of truth — derived from the Convex schema.
// These types update automatically when the schema changes.
export type KingdomResearch = Doc<"kingdoms">["research"];
export type KingdomBuildings = Doc<"kingdoms">["buildings"];

// All keys of the research object (topics + techs)
export type ResearchKey = keyof KingdomResearch;

// Building count keys — exclude metadata fields (queue, target) and
// special/disabled fields (rubble, ach) not present in buildingsTypes
export type BuildingType = Exclude<
	keyof {
		[K in keyof KingdomBuildings as KingdomBuildings[K] extends number
			? K
			: never]: never;
	},
	"rubble" | "ach"
>;

// Convenience subsets
export type ResearchTopicType =
	| "pop"
	| "power"
	| "mil"
	| "money"
	| "fdc"
	| "warp";
export type ResearchTechType = Exclude<ResearchKey, ResearchTopicType>;

export interface ResearchData {
	pts: number;
	perc: number;
}

export interface MilitaryUnitConfig {
	cost: number;
	sol: number;
	power: number;
	housing: number;
	off: number;
	def: number;
	researchRequired?: ResearchTechType;
	buildingRequired?: BuildingType;
}

export interface ResearchTechConfig {
	requirePoints: number;
	requires?: ResearchKey;
	bonus?: number;
}

export interface BuildingConfig {
	label: string;
	researchRequired?: ResearchTechType;
}

export type KingdomMilitary = Doc<"kingdoms">["military"];

// Military unit keys — exclude the nested queue object
export type MilitaryUnitType = keyof {
	[K in keyof KingdomMilitary as KingdomMilitary[K] extends number
		? K
		: never]: never;
};
