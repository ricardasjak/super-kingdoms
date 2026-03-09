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
