import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
	GAME_PARAMS,
	PLANET_TYPES,
	RACE_TYPES,
} from "../src/constants/game-params";
import { calculateNw } from "../src/utils/nwUtils";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

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
	autoExplore: false,
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
		hgl: 0,
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
			hgl: [],
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
		dr: { pts: 0, perc: 0 },
		ft: { pts: 0, perc: 0 },
		tf: { pts: 0, perc: 0 },
		ld: { pts: 0, perc: 0 },
		lf: { pts: 0, perc: 0 },
		f74: { pts: 0, perc: 0 },
		hgl: { pts: 0, perc: 0 },
		ht: { pts: 0, perc: 0 },
	},
	researchAutoAssign: [] as string[],
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
			hgl: 0,
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
				hgl: [],
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

		await ctx.db.insert("kingdoms", {
			userId,
			kdName: args.kdName,
			rulerName: args.rulerName,
			planetType: args.planetType,
			raceType: args.raceType,
			...STARTING_VALUES,
			nw,
			military,
			buildings: {
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
			},
		});
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

export const updateRulerName = mutation({
	args: {
		rulerName: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!existing) throw new Error("Kingdom not found");

		await ctx.db.patch(existing._id, {
			rulerName: args.rulerName,
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
			const randomKdName = Math.floor(Math.random() * 1000000000).toString();
			const fakeUserId = `fake_user_${Math.random().toString(36).substring(7)}`;

			const { _id, _creationTime, ...kdData } = existingKd;

			await ctx.db.insert("kingdoms", {
				...kdData,
				userId: fakeUserId,
				kdName: randomKdName,
			});
		}

		return { success: true };
	},
});

import {
	calculateFreeLand,
	calculateMilitaryQueue,
	calculateNewQueue,
} from "../src/utils/buildingUtils";

export const buildBuildings = mutation({
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
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

		if (!kingdom.buildings) throw new Error("Buildings not found");

		if (
			args.res < 0 ||
			args.plants < 0 ||
			args.rax < 0 ||
			args.sm < 0 ||
			args.pf < 0 ||
			args.tc < 0 ||
			args.asb < 0 ||
			args.ach < 0
		) {
			throw new Error("Invalid request: negative building counts");
		}

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

		// Research validation for special buildings
		for (const [unitKey, techInfo] of Object.entries(
			GAME_PARAMS.militaryTechTree,
		)) {
			if (techInfo?.building) {
				const buildingKey = techInfo.building as keyof typeof args;
				if (args[buildingKey] > 0) {
					const researchData = (
						kingdom.research as Record<string, { pts: number; perc: number }>
					)[unitKey];
					if (!researchData || researchData.perc < 100) {
						throw new Error(
							`Cannot build ${buildingKey}. Research for ${unitKey} must be 100% complete.`,
						);
					}
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

export const trainMilitary = mutation({
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
		hgl: v.number(),
		ht: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

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
				key: "hgl",
				value: args.hgl,
				cost: getDiscountedCost(units.hgl.cost),
				sol: units.hgl.sol,
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

				const techRequirement =
					GAME_PARAMS.militaryTechTree[
						unit.key as keyof typeof GAME_PARAMS.militaryTechTree
					];
				if (techRequirement) {
					const research =
						kingdom.research[unit.key as keyof typeof kingdom.research];
					if (!research || research.perc < 100) {
						throw new Error(
							`Cannot train ${unit.key}. Research must be 100% complete.`,
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

		const tfHousingLimit =
			kingdom.buildings.asb * GAME_PARAMS.buildings.asbCapacity;
		const currentTf = kingdom.military.tf || 0;
		const tfInQueue = (kingdom.military.queue.tf || []).reduce(
			(a, b) => a + b,
			0,
		);
		const newTfCount = args.tf;
		if (newTfCount > 0 && currentTf + tfInQueue + newTfCount > tfHousingLimit) {
			throw new Error(
				`Cannot train Tactical Fighters. Housing capacity: ${tfHousingLimit} (ASB: ${kingdom.buildings.asb} × ${GAME_PARAMS.buildings.asbCapacity}). Currently have ${currentTf} + ${tfInQueue} in queue.`,
			);
		}

		const f74HousingLimit =
			kingdom.buildings.ach * GAME_PARAMS.buildings.achCapacity;
		const currentF74 = kingdom.military.f74 || 0;
		const f74InQueue = (kingdom.military.queue.f74 || []).reduce(
			(a, b) => a + b,
			0,
		);
		const newF74Count = args.f74;
		if (
			newF74Count > 0 &&
			currentF74 + f74InQueue + newF74Count > f74HousingLimit
		) {
			throw new Error(
				`Cannot train Interceptor Drones. Housing capacity: ${f74HousingLimit} (ACH: ${kingdom.buildings.ach} × ${GAME_PARAMS.buildings.achCapacity}). Currently have ${currentF74} + ${f74InQueue} in queue.`,
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

import { calculateExplorationQueue } from "../src/utils/landUtils";

export const disbandMilitary = mutation({
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
		hgl: v.number(),
		ht: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

		const military = kingdom.military;
		const units = GAME_PARAMS.military.units;
		let moneyRefund = 0;
		let soldiersRecovered = 0;
		let populationRecovered = 0;

		const newMilitary = { ...military };

		for (const [key, count] of Object.entries(args)) {
			if (count <= 0) continue;

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

export const exploreLand = mutation({
	args: {
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

		if (args.amount <= 0) {
			throw new Error("Invalid exploration amount");
		}

		const currentQueueSum = kingdom.landQueue.reduce((a, b) => a + b, 0);
		const maxPossibleExplore = Math.floor(kingdom.land * 0.1);

		const maxExplore = Math.max(0, maxPossibleExplore - currentQueueSum);

		if (args.amount > maxExplore) {
			throw new Error(
				`Cannot explore more than 10% of current land combined with the current queue (${maxExplore} max available to request)`,
			);
		}

		const costPerLand = GAME_PARAMS.explore.cost(kingdom.land);
		const totalCost = costPerLand * args.amount;

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money for exploration");
		}

		const currentQueue = kingdom.landQueue;
		const newQueue = calculateExplorationQueue(
			currentQueue,
			args.amount,
			GAME_PARAMS.explore.duration,
		);

		await ctx.db.patch(kingdom._id, {
			money: kingdom.money - totalCost,
			landQueue: newQueue,
		});
	},
});

export const toggleAutoExplore = mutation({
	args: {
		autoExplore: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

		await ctx.db.patch(kingdom._id, {
			autoExplore: args.autoExplore,
		});
	},
});

export const saveAutoBuildSettings = mutation({
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
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!kingdom) throw new Error("Kingdom not found");

		console.log("args.target", args.target);

		const sum =
			args.target.res +
			args.target.plants +
			args.target.rax +
			args.target.sm +
			args.target.pf +
			args.target.tc +
			args.target.asb +
			args.target.ach;

		if (sum > 100) {
			throw new Error("Target percentages cannot exceed 100%");
		}

		await ctx.db.patch(kingdom._id, {
			autoBuild: args.autoBuild,
			buildings: { ...kingdom.buildings, target: args.target },
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

				if (!kingdom.research.dr) {
					patch.research = {
						...kingdom.research,
						dr: { pts: 0, perc: 0 },
						ft: { pts: 0, perc: 0 },
						tf: { pts: 0, perc: 0 },
						ld: { pts: 0, perc: 0 },
						lf: { pts: 0, perc: 0 },
						f74: { pts: 0, perc: 0 },
						hgl: { pts: 0, perc: 0 },
						ht: { pts: 0, perc: 0 },
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
			hgl: v.number(),
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

export const assignResearchPoints = mutation({
	args: {
		pop: v.number(),
		power: v.number(),
		mil: v.number(),
		money: v.number(),
		fdc: v.number(),
		warp: v.number(),
		dr: v.number(),
		ft: v.number(),
		tf: v.number(),
		ld: v.number(),
		lf: v.number(),
		f74: v.number(),
		hgl: v.number(),
		ht: v.number(),
		fusion: v.number(),
		core: v.number(),
		armor: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
		if (!kingdom) throw new Error("Kingdom not found");

		const researchKeys = [
			"pop",
			"power",
			"mil",
			"money",
			"fdc",
			"dr",
			"ft",
			"tf",
			"ld",
			"lf",
			"f74",
			"hgl",
			"ht",
			"fusion",
			"core",
			"warp",
			"armor",
		] as const;

		let totalPoints = 0;
		for (const key of researchKeys) {
			totalPoints += args[key];
		}

		if (totalPoints > kingdom.researchPts) {
			throw new Error("Not enough research points");
		}

		for (const key of researchKeys) {
			if (args[key] < 0) {
				throw new Error("Invalid negative points");
			}
		}

		if (totalPoints === 0) return { success: true };

		const newResearch = { ...kingdom.research };
		const standardKeys = [
			"pop",
			"power",
			"mil",
			"money",
			"fdc",
			"warp",
		] as const;

		for (const key of standardKeys) {
			if (args[key] > 0) {
				const prerequisite = (
					GAME_PARAMS.researchPrerequisites as Record<string, string>
				)[key];
				if (prerequisite) {
					const preData = (
						newResearch as Record<string, { pts: number; perc: number }>
					)[prerequisite];
					if (!preData || (preData.perc ?? 0) < 100) {
						throw new Error(
							`Cannot research ${key}. Must complete ${prerequisite} first.`,
						);
					}
				}
				const currentPts = newResearch[key].pts;
				const newPts = currentPts + args[key];
				const required = GAME_PARAMS.research.required(key, kingdom.land);
				const maxBonus = GAME_PARAMS.research.bonuses[key];
				let perc = 0;
				if (required > 0) {
					perc = Math.min(Math.floor((maxBonus * newPts) / required), maxBonus);
				}
				newResearch[key] = { pts: newPts, perc };
			}
		}

		const techKeys = [
			"dr",
			"ft",
			"tf",
			"ld",
			"lf",
			"f74",
			"hgl",
			"ht",
			"fusion",
			"core",
			"warp",
			"armor",
		] as const;
		for (const key of techKeys) {
			if (args[key] > 0) {
				const techInfo =
					GAME_PARAMS.militaryTechTree[
						key as keyof typeof GAME_PARAMS.militaryTechTree
					];
				if (!techInfo) continue;

				if (techInfo.requires) {
					const prerequisite =
						newResearch[techInfo.requires as keyof typeof newResearch];
					if (!prerequisite || (prerequisite.perc ?? 0) < 100) {
						throw new Error(
							`Cannot research ${key}. Must complete ${techInfo.requires} first.`,
						);
					}
				}

				const currentPts = newResearch[key]?.pts ?? 0;
				const newPts = currentPts + args[key];
				const required = techInfo.requirePoints;
				let perc = 0;
				if (required > 0) {
					perc = Math.min(Math.floor((newPts / required) * 100), 100);
				}
				newResearch[key] = { pts: newPts, perc };
			}
		}

		await ctx.db.patch(kingdom._id, {
			researchPts: kingdom.researchPts - totalPoints,
			research: newResearch,
		});

		return { success: true };
	},
});

export const saveResearchAutoAssign = mutation({
	args: {
		priority: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
		if (!kingdom) throw new Error("Kingdom not found");

		await ctx.db.patch(kingdom._id, {
			researchAutoAssign: args.priority,
		});
	},
});

export const buyScientists = mutation({
	args: {
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const kingdom = await ctx.db
			.query("kingdoms")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
		if (!kingdom) throw new Error("Kingdom not found");

		const amount = Math.floor(args.amount);
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
				hgl: 0,
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
