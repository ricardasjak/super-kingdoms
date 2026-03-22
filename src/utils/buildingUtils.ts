export type BuildingsQueue = {
	res: number[];
	plants: number[];
	rax: number[];
	sm: number[];
	pf: number[];
	tc: number[];
	asb: number[];
	ach: number[];
};

export type BuildingCounts = {
	res: number;
	plants: number;
	rax: number;
	sm: number;
	pf: number;
	tc: number;
	asb: number;
	ach: number;
	rubble: number;
};

const BUILDING_KEYS = [
	"res",
	"plants",
	"rax",
	"sm",
	"pf",
	"tc",
	"asb",
	"ach",
] as const;

export function calculateFreeLand(
	kingdomLand: number,
	buildings: BuildingCounts & { rubble: number },
	queue?: BuildingsQueue,
): number {
	const buildingSum =
		buildings.res +
		buildings.plants +
		buildings.rax +
		buildings.sm +
		buildings.pf +
		buildings.tc +
		buildings.asb +
		buildings.ach +
		buildings.rubble;

	let queueSum = 0;
	if (queue) {
		for (const key of BUILDING_KEYS) {
			if (queue[key]) {
				for (const amount of queue[key]) {
					queueSum += amount;
				}
			}
		}
	}

	return kingdomLand - buildingSum - queueSum;
}

type MilitaryQueue = {
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
	hgl: number[];
	ht: number[];
	sci: number[];
};

export function calculateMilitaryQueue(
	currentQueue: MilitaryQueue | undefined,
	requestedUnits: {
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
		hgl: number;
		ht: number;
		sci: number;
	},
	ticks = 24,
): MilitaryQueue {
	const safeQueue = currentQueue || {
		sol: [],
		tr: [],
		dr: [],
		ft: [],
		tf: [],
		lt: [],
		ld: [],
		lf: [],
		f74: [],
		t: [],
		hgl: [],
		ht: [],
		sci: [],
	};

	const MILITARY_KEYS = [
		"sol",
		"tr",
		"dr",
		"ft",
		"tf",
		"lt",
		"ld",
		"lf",
		"f74",
		"t",
		"hgl",
		"ht",
		"sci",
	] as const;

	const newQueue: MilitaryQueue = {
		sol: [...(safeQueue.sol || [])],
		tr: [...(safeQueue.tr || [])],
		dr: [...(safeQueue.dr || [])],
		ft: [...(safeQueue.ft || [])],
		tf: [...(safeQueue.tf || [])],
		lt: [...(safeQueue.lt || [])],
		ld: [...(safeQueue.ld || [])],
		lf: [...(safeQueue.lf || [])],
		f74: [...(safeQueue.f74 || [])],
		t: [...(safeQueue.t || [])],
		hgl: [...(safeQueue.hgl || [])],
		ht: [...(safeQueue.ht || [])],
		sci: [...(safeQueue.sci || [])],
	};

	for (const key of MILITARY_KEYS) {
		while (newQueue[key].length < ticks) {
			newQueue[key].push(0);
		}
	}

	for (const key of MILITARY_KEYS) {
		const amount = requestedUnits[key as keyof typeof requestedUnits];
		if (amount <= 0) continue;

		const perTick = Math.floor(amount / ticks);
		let remainder = amount % ticks;

		for (let i = 0; i < ticks; i++) {
			newQueue[key][i] += perTick;
		}

		let backIndex = ticks - 1;
		while (remainder > 0 && backIndex >= 0) {
			newQueue[key][backIndex] += 1;
			remainder--;
			backIndex--;
		}
	}

	return newQueue;
}

export function calculateNewQueue(
	currentQueue: BuildingsQueue | undefined,
	requestedBuildings: Omit<BuildingCounts, "rubble">,
	ticks = 16,
): BuildingsQueue {
	const safeQueue = currentQueue || {
		res: [],
		plants: [],
		rax: [],
		sm: [],
		pf: [],
		tc: [],
		asb: [],
		ach: [],
	};

	const newQueue: BuildingsQueue = {
		res: [...(safeQueue.res || [])],
		plants: [...(safeQueue.plants || [])],
		rax: [...(safeQueue.rax || [])],
		sm: [...(safeQueue.sm || [])],
		pf: [...(safeQueue.pf || [])],
		tc: [...(safeQueue.tc || [])],
		asb: [...(safeQueue.asb || [])],
		ach: [...(safeQueue.ach || [])],
	};

	// Ensure all queues are at least 'ticks' long
	for (const key of BUILDING_KEYS) {
		while (newQueue[key].length < ticks) {
			newQueue[key].push(0);
		}
	}

	for (const key of BUILDING_KEYS) {
		const amount = requestedBuildings[key];
		if (amount <= 0) continue;

		const perTick = Math.floor(amount / ticks);
		let remainder = amount % ticks;

		// Add base perTick everywhere
		for (let i = 0; i < ticks; i++) {
			newQueue[key][i] += perTick;
		}

		// Distribute remainder from the back
		let backIndex = ticks - 1;
		while (remainder > 0 && backIndex >= 0) {
			newQueue[key][backIndex] += 1;
			remainder--;
			backIndex--;
		}
	}

	return newQueue;
}
