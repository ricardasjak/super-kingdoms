import { type Kingdom } from '~/kingdom';

export interface UserSession {
	userId: number;
	clerkUserId: string;
	email: string;
}

export interface User {
	id: number;
	clerkUserId?: string;
	email: string;
	lastActiveAt?: string;
}

export interface Round {
	id: number;
	startAt: number;
	tickLength: number;
}

export interface Player {
	id: number;
	userId: number;
	round: number;
	kingdoms: number[];
}

export interface Budget {
	exploration: number;
	construction: number;
	military: number;
	// research: number;
}

export interface Buildings {
	residences: number;
	starMines: number;
	barracks: number;
	powerPlants: number;
	trainingCamps: number;
	probeFactories: number;
}

export interface BuildingsPlan extends Buildings {}

export interface BuildingsBuilt extends Buildings {}

export interface MilitaryBase {
	sold: number | undefined;
	lt: number | undefined;
	ld: number | undefined;
	tr: number | undefined;
	dr: number | undefined;
	t: number | undefined;
	// hgl?: number;
	// tf?: number;
	sci: number | undefined;
}

export interface MilitaryPlan extends MilitaryBase {} //Omit<MilitaryBase, 'sci'> {}

export interface Military extends MilitaryBase {}

export interface KingdomStatus {
	pop: number;
	money: number;
	income: number;
	nw: number;
	land: number;
	power: number;
	powerChange: number;
	probes: number;
	attempts: number;
	tick: number;
	lastNewsId: number;
	attackMeter: number;
}

export const PROBE_MISSIONS = ['SOK', 'SOM'] as const;
export type ProbesMission = (typeof PROBE_MISSIONS)[number];

export interface SOKReport {
	at: string;
	name: string;
	ruler: string;
	pop: number;
	money: number;
	income: number;
	nw: number;
	land: number;
	power: number;
	powerChange: number;
	attempts: number;
	tick: number;
	military: Military;
}

export interface FailedSpy {
	message: string;
}

export type ProbeReport = SOKReport | FailedSpy;

export interface Probing {
	attackerId: number;
	targetId: number;
	createdAt: string;
	probes: number;
	success: boolean;
	successRate: number;
	probesLost: number;
	damage: number;
	mission: ProbesMission;
	report: ProbeReport;
}

export type AttackStatus = 'forward' | 'return' | 'complete';

export interface AttackGains {
	land: number;
	money: number;
	pop: number;
	power: number;
	sci: number;
	probes: number;
}

export interface Attack {
	attackerId: number;
	targetId: number;
	createdAt: string;
	success: boolean;
	successNumber: number;
	successPercentage: number;
	attackerMilitary: Military;
	attackerPoints: number;
	attackerLosses: Partial<Military>;
	defenderPoints: number;
	defenderMilitary: Military;
	defenderLosses: Partial<Military>;
	gains?: AttackGains;
}

// export type News = ProbesNews | AttackNews;

export type News = ProbesNews | AttackNews;

export interface ProbesNews {
	id: number;
	attackerId: number;
	probeId: number;
}

export interface AttackNews {
	id: number;
	attackerId: number;
	attackId: number;
}

export type PersonalNews = PersonalAttackNews | PersonalProbeNews;

export interface PersonalProbeNews {
	id: number;
	at: string;
	attackerId?: number;
	attackerName?: string;
	probing: {
		success: boolean;
		successPercentage: number;
		damage: number;
		probesLost: number;
	};
}

export interface PersonalAttackNews {
	id: number;
	at: string;
	attackerId: number;
	attackerName: string;
	attack: {
		success: boolean;
		successPercentage: number;
		gains?: AttackGains;
		// report: string;
		defenderLosses: Partial<Military>;
		attackerLosses: Partial<Military>;
	};
}

export const SIDES = ['n', 'e', 's', 'w'];
export type Side = (typeof SIDES)[number];

export interface DefenceAllocation {
	n: number;
	e: number;
	s: number;
	w: number;
}

export type KingdomFull = {
	kingdom: Kingdom;
	status: KingdomStatus;
	budget: Budget;
	buildings: Buildings;
	buildingsPlan: BuildingsPlan;
	defence: DefenceAllocation;
	military: MilitaryBase;
	militaryPlan: MilitaryPlan;
	news: Array<News>;
};

export interface AppState {
	rounds: Map<number, Round>;
	users: Map<number, User>;
	players: Map<number, Player>;
	kingdoms: Map<number, Kingdom>;
	kingdomsStatus: Map<number, KingdomStatus>;
	budgets: Map<number, Budget>;
	defence: Map<number, DefenceAllocation>;
	buildings: Map<number, BuildingsBuilt>;
	buildingsPlan: Map<number, BuildingsPlan>;
	military: Map<number, Military>;
	militaryPlan: Map<number, MilitaryPlan>;
	probings: Map<number, Map<number, Probing>>;
	news: Map<number, Map<number, News>>;
	attacks: Map<number, Map<number, Attack>>;
	status: 'empty' | 'loading' | 'ready';
}
