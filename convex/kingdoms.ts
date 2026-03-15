import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
	GAME_PARAMS,
	PLANET_TYPES,
	RACE_TYPES,
} from "../src/constants/game-params";
import { internal } from "./_generated/api";
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

		await ctx.db.insert("kingdoms", {
			userId,
			kdName: args.kdName,
			rulerName: args.rulerName,
			planetType: args.planetType,
			raceType: args.raceType,
			...STARTING_VALUES,
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

		const units = GAME_PARAMS.military.units;
		let totalCost = 0;
		let hasValidUnit = false;
		let soldiersToDeduct = 0;

		const trainableUnits = [
			{ key: "sol", value: args.sol, cost: units.sol.cost },
			{ key: "tr", value: args.tr, cost: units.tr.cost },
			{ key: "dr", value: args.dr, cost: units.dr.cost },
			{ key: "ft", value: args.ft, cost: units.ft.cost },
			{
				key: "tf",
				value: args.tf,
				cost: units.tf.cost,
			},
			{
				key: "lt",
				value: args.lt,
				cost: units.lt.cost,
			},
			{
				key: "ld",
				value: args.ld,
				cost: units.ld.cost,
			},
			{
				key: "lf",
				value: args.lf,
				cost: units.lf.cost,
			},
			{
				key: "f74",
				value: args.f74,
				cost: units.f74.cost,
			},
			{ key: "t", value: args.t, cost: units.t.cost },
			{
				key: "hgl",
				value: args.hgl,
				cost: units.hgl.cost,
			},
			{
				key: "ht",
				value: args.ht,
				cost: units.ht.cost,
			},
		];

		for (const unit of trainableUnits) {
			if (unit.key === "sol" && unit.value < 0) {
				soldiersToDeduct = -unit.value;
				unit.value = 0;
			} else if (unit.value < 0) {
				throw new Error("Invalid request: negative unit counts");
			}
			if (unit.value > 0) {
				hasValidUnit = true;
			}
			totalCost += unit.value * unit.cost;
		}

		if (!hasValidUnit) {
			throw new Error("Invalid request: no units specified");
		}

		if (kingdom.money < totalCost) {
			throw new Error("Not enough money");
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
				const patch: Record<string, number> = {};

				// Handle missing probes field from before it was introduced
				if (kingdom.probes === undefined) {
					patch.probes = 0;
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
