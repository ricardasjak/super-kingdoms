import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
	BOT_NAME_PREFIXES,
	BOT_NAME_SUFFIXES,
} from "../src/constants/bot-names";
import {
	GAME_PARAMS,
	PLANET_TYPES,
	RACE_TYPES,
} from "../src/constants/game-params";
import type { MilitaryUnitConfig } from "../src/types/game";
import {
	calculateFreeLand,
	calculateMilitaryQueue,
	calculateNewQueue,
} from "../src/utils/buildingUtils";
import { calculateExplorationQueue } from "../src/utils/landUtils";
import { calculateNw } from "../src/utils/nwUtils";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { kingdomMutation } from "./functions";

const STARTING_VALUES = {
	population: 2250,
	popChange: 0,
	land: 250,
	money: 300000,
	power: 10000,
	probes: 0,
	moneyIncome: 0,
	powerIncome: 0,
	landQueue: [] as number[],
	autoExplore: 10,
	autoBuild: false,
	military: {
		sol: 200,
		tr: 0,
		dr: 0,
		ft: 0,
		tf: 0,
		lt: 0,
		ld: 0,
		lf: 0,
		f74: 0,
		t: 0,
		ht: 0,
		sci: 100,
		queue: {
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
			ht: [],
			sci: [],
		},
	},
	researchPts: 0,
	research: {
		pop: { pts: 0, perc: 0 },
		power: { pts: 0, perc: 0 },
		mil: { pts: 0, perc: 0 },
		money: { pts: 0, perc: 0 },
		fdc: { pts: 0, perc: 0 },
		warp: { pts: 0, perc: 0 },
		r_dr: { pts: 0, perc: 0 },
		r_ft: { pts: 0, perc: 0 },
		r_tf: { pts: 0, perc: 0 },
		r_ld: { pts: 0, perc: 0 },
		r_lf: { pts: 0, perc: 0 },
		r_f74: { pts: 0, perc: 0 },
		r_ht: { pts: 0, perc: 0 },
		r_fusion: { pts: 0, perc: 0 },
		r_core: { pts: 0, perc: 0 },
		r_armor: { pts: 0, perc: 0 },
		r_long: { pts: 0, perc: 0 },
	},
	researchAutoAssign: [] as string[],
};

const INITIAL_BUILDING_TARGETS = {
	res: 25,
	sm: 25,
	rax: 20,
	plants: 10,
	tc: 10,
	pf: 10,
	asb: 0,
	ach: 0,
};

export const getMyKingdom = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		return await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
	},
});

export const createKingdom = mutation({
	args: {
		kdName: v.string(),
		rulerName: v.string(),
		planetType: v.string(),
		raceType: v.string(),
		botNames: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
		if (existing) throw new Error("Kingdom already exists");

		if (!(PLANET_TYPES as readonly string[]).includes(args.planetType)) {
			throw new Error(`Invalid planet type: ${args.planetType}`);
		}
		if (!(RACE_TYPES as readonly string[]).includes(args.raceType)) {
			throw new Error(`Invalid race type: ${args.raceType}`);
		}

		const buildings = {
			res: 80,
			plants: 40,
			rax: 10,
			sm: 30,
			pf: 10,
			tc: 0,
			asb: 0,
			ach: 0,
			rubble: 0,
			queue: {
				res: [],
				plants: [],
				rax: [],
				sm: [],
				pf: [],
				tc: [],
				asb: [],
				ach: [],
			},
			target: INITIAL_BUILDING_TARGETS,
		};

		const military = {
			sol: 200,
			tr: 0,
			dr: 0,
			ft: 0,
			tf: 0,
			lt: 0,
			ld: 0,
			lf: 0,
			f74: 0,
			t: 0,
			ht: 0,
			sci: 300,
			queue: {
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
				ht: [],
				sci: [],
			},
		};

		const nw = calculateNw({
			military,
			buildings,
			land: STARTING_VALUES.land,
			population: STARTING_VALUES.population,
			money: STARTING_VALUES.money,
			probes: STARTING_VALUES.probes,
		});

		const playerKdId = await ctx.db.insert("kingdoms", {
			userId,
			kdName: args.kdName,
			rulerName: args.rulerName,
			planetType: args.planetType,
			raceType: args.raceType,
			...STARTING_VALUES,
			nw,
			military,
			buildings,
		});

		// Create bots
		const botPrefix = args.kdName.split(" ")[0] || "Bot";
		const botLimit = GAME_PARAMS.bots.limitPerKingdom;
		for (let i = 0; i < botLimit; i++) {
			const botPlanetType =
				PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
			const botRaceType =
				RACE_TYPES[Math.floor(Math.random() * RACE_TYPES.length)];
			const botKdName =
				args.botNames?.[i] ||
				(() => {
					const s =
						BOT_NAME_SUFFIXES[
							Math.floor(Math.random() * BOT_NAME_SUFFIXES.length)
						];
					return `${botPrefix} ${s} ${Math.floor(Math.random() * 900) + 100}`;
				})();
			const botRulerName = args.rulerName;

			const botNw = calculateNw({
				military,
				buildings,
				land: STARTING_VALUES.land,
				population: STARTING_VALUES.population,
				money: STARTING_VALUES.money,
				probes: STARTING_VALUES.probes,
			});

			await ctx.db.insert("kingdoms", {
				...STARTING_VALUES,
				autoBuild: true,
				kdName: botKdName,
				rulerName: botRulerName,
				planetType: botPlanetType,
				raceType: botRaceType,
				nw: botNw,
				military,
				buildings,
				botOwnerKd: playerKdId,
			});
		}
	},
});

export const releaseKingdom = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				userId: undefined,
			});
		}
	},
});

export const deleteKingdom = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
		}
	},
});

export const getKingdomsCount = query({
	args: {},
	handler: async (ctx) => {
		const kingdoms = await ctx.db.query("kingdoms").collect();
		return kingdoms.length;
	},
});

export const searchKingdoms = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("kingdoms")
			.withIndex("by_land_nw")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const updateRulerName = kingdomMutation({
	args: {
		rulerName: v.string(),
	},
	handler: async (ctx, { rulerName, kingdom: existing }) => {
		await ctx.db.patch(existing._id, {
			rulerName,
		});
	},
});

export const populateKingdoms = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existingKd = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!existingKd)
			throw new Error("You must create a kingdom first to clone it");

		// Clone the kingdom 1000 times
		for (let i = 0; i < 1000; i++) {
			const prefix =
				BOT_NAME_PREFIXES[Math.floor(Math.random() * BOT_NAME_PREFIXES.length)];
			const suffix =
				BOT_NAME_SUFFIXES[Math.floor(Math.random() * BOT_NAME_SUFFIXES.length)];
			const randomKdName = `${prefix} ${suffix} ${Math.floor(Math.random() * 900) + 100}`;

			const { _id, _creationTime, ...kdData } = existingKd;

			const randomLand = Math.floor(Math.random() * 2250) + 250; // 250 to 2500
			// Scale population with land roughly (starting 250 land -> 2250 pop, so 9 pop/land)
			const randomPop = randomLand * 9;

			const randomNw = calculateNw({
				military: kdData.military,
				buildings: kdData.buildings,
				land: randomLand,
				population: randomPop,
				money: kdData.money,
				probes: kdData.probes,
			});

			await ctx.db.insert("kingdoms", {
				...kdData,
				userId: undefined,
				botOwnerKd: "freelancer",
				autoBuild: true,
				kdName: randomKdName,
				land: randomLand,
				population: randomPop,
				nw: randomNw,
				buildings: {
					...kdData.buildings,
					target: kdData.buildings.target || INITIAL_BUILDING_TARGETS,
				},
				planetType:
					PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)],
				raceType: RACE_TYPES[Math.floor(Math.random() * RACE_TYPES.length)],
			});
		}

		return { success: true };
	},
});

export const buildBuildings = kingdomMutation({
	args: {
		res: v.number(),
		plants: v.number(),
		rax: v.number(),
		sm: v.number(),
		pf: v.number(),
		tc: v.number(),
		asb: v.number(),
		ach: v.number(),
	},
	handler: async (ctx, { kingdom, ...args }) => {
		if (!kingdom.buildings) throw new Error("Buildings not found");

		const requestSum =
			args.res +
			args.plants +
			args.rax +
			args.sm +
			args.pf +
			args.tc +
			args.asb +
			args.ach;

		const freeLand = calculateFreeLand(
			kingdom.land,
			kingdom.buildings,
			kingdom.buildings.queue,
		);

		if (requestSum <= 0) {
			throw new Error("Invalid request");
		}
		if (requestSum > freeLand) {
			throw new Error("Not enough free land");
		}

		// Research validation
		for (const [bldKey, bldConfig] of Object.entries(
			GAME_PARAMS.buildingsTypes,
		)) {
			const requestedCount = (args as Record<string, number>)[bldKey] || 0;
			if (requestedCount > 0 && bldConfig.researchRequired) {
				const researchData = (
					kingdom.research as Record<string, { pts: number; perc: number }>
				)[bldConfig.researchRequired];
				if (!researchData || researchData.perc < 100) {
					throw new Error(
						`Cannot build ${bldConfig.label}. Research for ${bldConfig.researchRequired} must be 100% complete.`,
					);
				}
			}
		}

		const buildingCost = GAME_PARAMS.buildings.cost(kingdom.land);
		const totalCost = requestSum * buildingCost;

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money");
		}

		const newQueue = calculateNewQueue(
			kingdom.buildings.queue,
			args,
			GAME_PARAMS.buildings.duration,
		);

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money - totalCost,
			buildings: { ...kingdom.buildings, queue: newQueue },
		});
	},
});

export const trainMilitary = kingdomMutation({
	args: {
		sol: v.number(),
		sci: v.number(),
		tr: v.number(),
		dr: v.number(),
		ft: v.number(),
		tf: v.number(),
		lt: v.number(),
		ld: v.number(),
		lf: v.number(),
		f74: v.number(),
		t: v.number(),
		ht: v.number(),
	},
	handler: async (ctx, { kingdom, ...args }) => {
		if (!kingdom.military) throw new Error("Military not found");

		const buildings = kingdom.buildings;
		const tcCount = buildings?.tc ?? 0;
		const land = kingdom.land;
		const tcDiscount = GAME_PARAMS.military.calculateTcDiscount(tcCount, land);

		const units = GAME_PARAMS.military.units;
		let totalCost = 0;
		let hasValidUnit = false;
		let soldiersToDeduct = 0;

		const getDiscountedCost = (baseCost: number) =>
			Math.floor((baseCost * (100 - tcDiscount)) / 100);

		const trainableUnits = [
			{ key: "sol", value: args.sol, cost: units.sol.cost, sol: units.sol.sol },
			{
				key: "tr",
				value: args.tr,
				cost: getDiscountedCost(units.tr.cost),
				sol: units.tr.sol,
			},
			{
				key: "dr",
				value: args.dr,
				cost: getDiscountedCost(units.dr.cost),
				sol: units.dr.sol,
			},
			{
				key: "ft",
				value: args.ft,
				cost: getDiscountedCost(units.ft.cost),
				sol: units.ft.sol,
			},
			{
				key: "tf",
				value: args.tf,
				cost: getDiscountedCost(units.tf.cost),
				sol: units.tf.sol,
			},
			{
				key: "lt",
				value: args.lt,
				cost: getDiscountedCost(units.lt.cost),
				sol: units.lt.sol,
			},
			{
				key: "ld",
				value: args.ld,
				cost: getDiscountedCost(units.ld.cost),
				sol: units.ld.sol,
			},
			{
				key: "lf",
				value: args.lf,
				cost: getDiscountedCost(units.lf.cost),
				sol: units.lf.sol,
			},
			{
				key: "f74",
				value: args.f74,
				cost: getDiscountedCost(units.f74.cost),
				sol: units.f74.sol,
			},
			{
				key: "t",
				value: args.t,
				cost: getDiscountedCost(units.t.cost),
				sol: units.t.sol,
			},
			{
				key: "ht",
				value: args.ht,
				cost: getDiscountedCost(units.ht.cost),
				sol: units.ht.sol,
			},
			{
				key: "sci",
				value: args.sci,
				cost: units.sci.cost,
				sol: units.sci.sol,
			},
		];

		for (const unit of trainableUnits) {
			if (unit.key === "sol" && unit.value < 0) {
				soldiersToDeduct += -unit.value;
				unit.value = 0;
			} else if (unit.value < 0) {
				throw new Error("Invalid request: negative unit counts");
			}
			if (unit.value > 0) {
				soldiersToDeduct += unit.value * (unit.sol || 0);
				hasValidUnit = true;

				const unitConfig = (
					GAME_PARAMS.military.units as Record<string, MilitaryUnitConfig>
				)[unit.key];
				const researchKey = unitConfig?.researchRequired;
				if (researchKey) {
					const research =
						kingdom.research[researchKey as keyof typeof kingdom.research];
					if (!research || research.perc < 100) {
						throw new Error(
							`Cannot train ${unit.key}. Research ${researchKey} must be 100% complete.`,
						);
					}
				}

				const buildingKey = unitConfig?.buildingRequired;
				if (buildingKey) {
					const buildingCount =
						kingdom.buildings[buildingKey as keyof typeof kingdom.buildings];
					if ((buildingCount || 0) <= 0) {
						throw new Error(
							`Cannot train ${unit.key}. Must have at least one ${buildingKey} building.`,
						);
					}
				}
			}
			totalCost += unit.value * unit.cost;
		}

		if (!hasValidUnit) {
			throw new Error("Invalid request: no units specified");
		}

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money");
		}

		if (kingdom.military.sol < soldiersToDeduct) {
			throw new Error("Not enough soldiers");
		}

		if (args.sci > 0) {
			const incomeCap = kingdom.moneyIncome * 3;
			if (args.sci > incomeCap) {
				throw new Error(
					`Cannot hire more than ${incomeCap.toLocaleString()} scientists (3x your money income limit).`,
				);
			}
		}

		if (args.sol > 0) {
			const soldiersInQueue = (kingdom.military.queue.sol || []).reduce(
				(a: number, b: number) => a + b,
				0,
			);
			const maxByPop = Math.floor(
				kingdom.population * GAME_PARAMS.military.soldiersLimit,
			);
			if (soldiersInQueue + args.sol > maxByPop) {
				throw new Error(
					`Cannot queue ${args.sol} soldiers. Training queue limit reached (${maxByPop} total allowed in training).`,
				);
			}
		}

		const asbCapacity =
			kingdom.buildings.asb * GAME_PARAMS.buildings.asbCapacity;
		const currentTf = kingdom.military.tf || 0;
		const tfInQueue = (kingdom.military.queue.tf || []).reduce(
			(a: number, b: number) => a + b,
			0,
		);
		const currentF74 = kingdom.military.f74 || 0;
		const f74InQueue = (kingdom.military.queue.f74 || []).reduce(
			(a: number, b: number) => a + b,
			0,
		);

		const tfHousing = GAME_PARAMS.military.units.tf.housing;
		const f74Housing = GAME_PARAMS.military.units.f74.housing;

		const usedAsb =
			(currentTf + tfInQueue) * tfHousing +
			(currentF74 + f74InQueue) * f74Housing;
		const requestedAsb = args.tf * tfHousing + args.f74 * f74Housing;

		if (requestedAsb > 0 && usedAsb + requestedAsb > asbCapacity) {
			throw new Error(
				`Not enough ASB capacity. Capacity: ${asbCapacity}. Currently used: ${usedAsb}. Requested: ${requestedAsb}.`,
			);
		}

		const newQueue = calculateMilitaryQueue(
			kingdom.military.queue,
			args,
			GAME_PARAMS.military.duration,
		);

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money - totalCost,
			military: {
				...kingdom.military,
				sol: kingdom.military.sol - soldiersToDeduct,
				queue: newQueue,
			},
		});
	},
});

export const disbandMilitary = kingdomMutation({
	args: {
		sol: v.number(),
		sci: v.number(),
		tr: v.number(),
		dr: v.number(),
		ft: v.number(),
		tf: v.number(),
		lt: v.number(),
		ld: v.number(),
		lf: v.number(),
		f74: v.number(),
		t: v.number(),
		ht: v.number(),
	},
	handler: async (ctx, { kingdom, ...args }) => {
		const military = kingdom.military;
		const units = GAME_PARAMS.military.units;
		let moneyRefund = 0;
		let soldiersRecovered = 0;
		let populationRecovered = 0;

		const newMilitary = { ...military };

		for (const [key, count] of Object.entries(args)) {
			if (typeof count !== "number" || count <= 0) continue;

			const unitKey = key as keyof typeof units;
			const currentCount = (military[unitKey] as number) || 0;

			if (count > currentCount) {
				throw new Error(
					`Cannot disband ${count} ${key}. Have ${currentCount}.`,
				);
			}

			// Deduct units
			(newMilitary[unitKey] as number) -= count;

			// Refund money (half base cost)
			moneyRefund += Math.floor((count * units[unitKey].cost) / 2);

			// Recover soldiers/population
			if (unitKey === "sol") {
				populationRecovered += count;
			} else {
				const unitSolCost = (units[unitKey] as (typeof units)["tr"]).sol || 0;
				if (unitSolCost > 0) {
					soldiersRecovered += count * unitSolCost;
				}
			}
		}

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money + moneyRefund,
			population: kingdom.population + populationRecovered,
			military: {
				...newMilitary,
				sol: newMilitary.sol + soldiersRecovered,
			},
		});

		return { success: true };
	},
});

export const exploreLand = kingdomMutation({
	args: {
		amount: v.number(),
	},
	handler: async (ctx, { kingdom, amount }) => {
		if (amount <= 0) {
			throw new Error("Invalid exploration amount");
		}

		const currentQueueSum = kingdom.landQueue.reduce(
			(a: number, b: number) => a + b,
			0,
		);
		const maxPossibleExplore = Math.floor(kingdom.land * 0.1);

		const maxExplore = Math.max(0, maxPossibleExplore - currentQueueSum);

		if (amount > maxExplore) {
			throw new Error(
				`Cannot explore more than 10% of current land combined with the current queue (${maxExplore} max available to request)`,
			);
		}

		const costPerLand = GAME_PARAMS.explore.cost(kingdom.land);
		const totalCost = costPerLand * amount;

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money for exploration");
		}

		const currentQueue = kingdom.landQueue;
		const newQueue = calculateExplorationQueue(
			currentQueue,
			amount,
			GAME_PARAMS.explore.duration,
		);

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money - totalCost,
			landQueue: newQueue,
		});
	},
});

export const razeBuildings = kingdomMutation({
	args: {
		res: v.number(),
		plants: v.number(),
		rax: v.number(),
		sm: v.number(),
		pf: v.number(),
		tc: v.number(),
		asb: v.number(),
		ach: v.number(),
	},
	handler: async (ctx, { kingdom, ...args }) => {
		const currentBuildings = kingdom.buildings;
		const buildingCost = GAME_PARAMS.buildings.cost(kingdom.land);
		let refund = 0;
		const updatedBuildings = { ...currentBuildings };

		for (const [key, count] of Object.entries(args)) {
			if (typeof count !== "number" || count <= 0) continue;

			type BuildingKey = Exclude<
				keyof typeof currentBuildings,
				"queue" | "target"
			>;
			const bldKey = key as BuildingKey;
			const currentCount = currentBuildings[bldKey] as number;

			if (count > currentCount) {
				throw new Error(`Cannot raze ${count} ${key}. Have ${currentCount}.`);
			}

			(updatedBuildings[bldKey] as number) = currentCount - count;
			refund += Math.floor((count * buildingCost) / 2);
		}

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money + refund,
			buildings: updatedBuildings,
		});
	},
});

export const toggleAutoExplore = kingdomMutation({
	args: {
		autoExplore: v.number(),
	},
	handler: async (ctx, { kingdom, autoExplore }) => {
		await ctx.db.patch(kingdom._id, {
			autoExplore,
		});
	},
});

export const saveAutoBuildSettings = kingdomMutation({
	args: {
		autoBuild: v.boolean(),
		target: v.object({
			res: v.number(),
			plants: v.number(),
			rax: v.number(),
			sm: v.number(),
			pf: v.number(),
			tc: v.number(),
			asb: v.number(),
			ach: v.number(),
		}),
	},
	handler: async (ctx, { kingdom, autoBuild, target }) => {
		console.log("args.target", target);

		const sum =
			target.res +
			target.plants +
			target.rax +
			target.sm +
			target.pf +
			target.tc +
			target.asb +
			target.ach;

		if (sum > 100) {
			throw new Error("Target percentages cannot exceed 100%");
		}

		await ctx.db.patch(kingdom._id, {
			autoBuild: autoBuild,
			buildings: { ...kingdom.buildings, target: target },
		});
	},
});

export const migrateKingdomsBatch = internalMutation({
	args: { cursor: v.union(v.string(), v.null()) },
	handler: async (ctx, args) => {
		const results = await ctx.db
			.query("kingdoms")
			.paginate({ cursor: args.cursor, numItems: 1000 });

		let patchCount = 0;
		await Promise.all(
			results.page.map(async (kingdom) => {
				const patch: Partial<Doc<"kingdoms">> = {};

				// Handle missing probes field from before it was introduced
				if (kingdom.probes === undefined) {
					patch.probes = 0;
				}

				if (!kingdom.research.r_dr) {
					patch.research = {
						...kingdom.research,
						r_dr: { pts: 0, perc: 0 },
						r_ft: { pts: 0, perc: 0 },
						r_tf: { pts: 0, perc: 0 },
						r_ld: { pts: 0, perc: 0 },
						r_lf: { pts: 0, perc: 0 },
						r_f74: { pts: 0, perc: 0 },
						r_ht: { pts: 0, perc: 0 },
					};
				}

				if (Object.keys(patch).length > 0) {
					await ctx.db.patch(kingdom._id, patch);
					patchCount++;
				}
			}),
		);

		return {
			isDone: results.isDone,
			continueCursor: results.continueCursor,
			count: patchCount,
		};
	},
});

export const migrateKingdoms = action({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		let isDone = false;
		let cursor: string | null = null;
		let totalMigrated = 0;

		while (!isDone) {
			const batchResult: {
				isDone: boolean;
				continueCursor: string;
				count: number;
			} = await ctx.runMutation(internal.kingdoms.migrateKingdomsBatch, {
				cursor,
			});
			isDone = batchResult.isDone;
			cursor = batchResult.continueCursor;
			totalMigrated += batchResult.count;
		}

		return { success: true, count: totalMigrated };
	},
});

export const getSpyReports = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await ctx.db
			.query("spyReports")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.order("desc")
			.take(20);
	},
});

export const saveSpyReport = mutation({
	args: {
		targetKdName: v.string(),
		targetRulerName: v.string(),
		targetPlanetType: v.string(),
		targetRaceType: v.string(),
		targetLevel: v.number(),
		land: v.number(),
		networth: v.number(),
		honor: v.number(),
		money: v.number(),
		population: v.number(),
		power: v.number(),
		probes: v.number(),
		scientists: v.number(),
		maProtection: v.number(),
		military: v.object({
			sol: v.number(),
			tr: v.number(),
			dr: v.number(),
			ft: v.number(),
			tf: v.number(),
			lt: v.number(),
			ld: v.number(),
			lf: v.number(),
			f74: v.number(),
			t: v.number(),
			ht: v.number(),
		}),
		maxDefPotential: v.number(),
		maxOffPotential: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		await ctx.db.insert("spyReports", {
			userId,
			...args,
			spiedAt: Date.now(),
		});
	},
});

export const saveResearchAutoAssign = kingdomMutation({
	args: {
		priority: v.array(v.string()),
	},
	handler: async (ctx, { kingdom, priority }) => {
		const cleanPriority = priority.filter((key: string) => {
			const standardKeys = ["pop", "power", "mil", "money", "fdc", "warp"];
			const isStandard = standardKeys.includes(key);
			if (isStandard) return true;

			const resData = kingdom.research[key as keyof typeof kingdom.research];
			if (!resData) return false;

			const techInfo =
				GAME_PARAMS.militaryTechTree[
					key as keyof typeof GAME_PARAMS.militaryTechTree
				];
			if (techInfo) return resData.pts < techInfo.requirePoints;
			return true;
		});

		await ctx.db.patch(kingdom._id, {
			researchAutoAssign: cleanPriority,
		});
	},
});

export const buyScientists = kingdomMutation({
	args: {
		amount: v.number(),
	},
	handler: async (ctx, { kingdom, amount: rawAmount }) => {
		const amount = Math.floor(rawAmount);
		if (amount <= 0) {
			throw new Error("Amount must be greater than zero.");
		}

		const costPerSci = GAME_PARAMS.military.units.sci.cost;
		const totalCost = amount * costPerSci;

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money to buy scientists.");
		}

		const soldiersRequired = amount * (GAME_PARAMS.military.units.sci.sol || 0);
		if (kingdom.military.sol < soldiersRequired) {
			throw new Error("Not enough soldiers to convert to scientists.");
		}

		const incomeCap = kingdom.moneyIncome * 3;
		if (amount > incomeCap) {
			throw new Error(
				`Cannot hire more than ${incomeCap.toLocaleString()} scientists at once (3x your money income).`,
			);
		}

		const updatedQueue = calculateMilitaryQueue(
			kingdom.military.queue,
			{
				sol: 0,
				tr: 0,
				dr: 0,
				ft: 0,
				tf: 0,
				lt: 0,
				ld: 0,
				lf: 0,
				f74: 0,
				t: 0,
				ht: 0,
				sci: amount,
			},
			GAME_PARAMS.military.duration,
		);

		const updatedMilitary = {
			...kingdom.military,
			sol: kingdom.military.sol - soldiersRequired,
			queue: updatedQueue,
		};

		const nw = calculateNw({
			military: updatedMilitary,
			buildings: kingdom.buildings,
			land: kingdom.land,
			population: kingdom.population,
			money: kingdom.money - totalCost,
			probes: kingdom.probes,
		});

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money - totalCost,
			military: updatedMilitary,
			nw,
		});

		return { success: true };
	},
});
