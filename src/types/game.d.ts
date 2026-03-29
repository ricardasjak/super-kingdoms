export type MilitaryUnitType =
	| "sol"
	| "sci"
	| "tr"
	| "dr"
	| "ft"
	| "tf"
	| "lt"
	| "ld"
	| "lf"
	| "f74"
	| "t"
	| "ht";

export type ResearchTopicType =
	| "pop"
	| "power"
	| "mil"
	| "money"
	| "fdc"
	| "warp";

export type ResearchTechType =
	| "r_dr"
	| "r_ft"
	| "r_tf"
	| "r_f74"
	| "r_ld"
	| "r_lf"
	| "r_ht"
	| "r_fusion"
	| "r_core"
	| "r_armor"
	| "r_long";

export type BuildingType =
	| "res"
	| "plants"
	| "rax"
	| "sm"
	| "pf"
	| "tc"
	| "asb";

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
	requires?: ResearchTechType;
	bonus?: number;
}

export interface BuildingConfig {
	label: string;
	researchRequired?: ResearchTechType;
}
