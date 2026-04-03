import type { KingdomResearch } from "../types/game";

export type MilitaryUnits = {
	sol: number;
	tr: number;
	dr: number;
	ft: number;
	tf: number;
	lt: number;
	ld: number;
	lf: number;
	f74: number;
	t: number;
	ht: number;
	sci: number;
	queue: {
		sol: number[];
		tr: number[];
		dr: number[];
		ft: number[];
		tf: number[];
		lt: number[];
		ld: number[];
		lf: number[];
		f74: number[];
		t: number[];
		ht: number[];
		sci: number[];
	};
};

export type KingdomSettings = {
	population: number;
	land: number;
	money: number;
	power: number;
	probes: number;
	moneyIncome: number;
	powerIncome: number;
	landQueue: number[];
	autoExplore?: number;
	autoBuild?: boolean;
	researchPts: number;
	researchAutoAssign?: string[];
	research: KingdomResearch;
	state?: "dead" | "newbiemode";
	popChange?: number;
};

export type BuildingState = {
	res: number;
	plants: number;
	rax: number;
	sm: number;
	pf: number;
	tc: number;
	asb: number;
	ach: number;
	rubble: number;
	target?: {
		res: number;
		plants: number;
		rax: number;
		sm: number;
		pf: number;
		tc: number;
		asb: number;
		ach: number;
	};
	queue: {
		res: number[];
		plants: number[];
		rax: number[];
		sm: number[];
		pf: number[];
		tc: number[];
		asb: number[];
		ach: number[];
	};
};

export type TickResult = {
	updatedKingdom: KingdomSettings;
	updatedBuildings: BuildingState | null;
	updatedMilitary: MilitaryUnits | null;
	kingdomChanged: boolean;
};
