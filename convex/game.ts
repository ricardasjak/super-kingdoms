import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { processKingdomTick } from "../src/utils/tickUtils";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

export const getGameStatus = query({
	args: {},
	handler: async (ctx) => {
		const existingStatus = await ctx.db.query("gameStatus").first();
		if (!existingStatus) {
			return { currentTick: 0, endTick: 20, roundNumber: 1 };
		}
		return existingStatus;
	},
});

export const advanceTick = action({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const startTime = Date.now();

		await ctx.runMutation(internal.game.startTick);

		let cursor: string | null = null;
		let isDone = false;

		while (!isDone) {
			const batchResult: { cursor: string | null; isDone: boolean } =
				await ctx.runMutation(internal.game.processBatch, {
					cursor,
				});
			cursor = batchResult.cursor;
			isDone = batchResult.isDone;
		}

		const endTime = Date.now();
		const finalExecutionTime = endTime - startTime;

		return {
			executionTimeMs: finalExecutionTime,
		};
	},
});

export const startTick = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existingStatus = await ctx.db.query("gameStatus").first();
		const status =
			existingStatus ??
			(await ctx.db.get(
				await ctx.db.insert("gameStatus", {
					currentTick: 0,
					endTick: 20,
					roundNumber: 1,
				}),
			));

		if (!status || status.currentTick >= status.endTick) {
			throw new Error("Game has reached the maximum number of ticks.");
		}

		// Increment tick
		await ctx.db.patch(status._id, { currentTick: status.currentTick + 1 });
	},
});

export const processBatch = internalMutation({
	args: { cursor: v.union(v.string(), v.null()) },
	handler: async (ctx, args) => {
		const { page, continueCursor, isDone } = await ctx.db
			.query("kingdoms")
			.paginate({ cursor: args.cursor, numItems: 500 });

		for (const kingdom of page) {
			const buildings = await ctx.db
				.query("buildings")
				.withIndex("by_kdid", (q) => q.eq("kdid", kingdom._id))
				.unique();

			if (!buildings) continue;

			const { updatedKingdom, updatedBuildings } = processKingdomTick(
				kingdom,
				buildings,
			);

			await ctx.db.patch(kingdom._id, {
				money: updatedKingdom.money,
				power: updatedKingdom.power,
				moneyIncome: updatedKingdom.moneyIncome,
				powerIncome: updatedKingdom.powerIncome,
				land: updatedKingdom.land,
				landQueue: updatedKingdom.landQueue,
			});

			if (updatedBuildings) {
				await ctx.db.patch(buildings._id, {
					res: updatedBuildings.res,
					plants: updatedBuildings.plants,
					rax: updatedBuildings.rax,
					sm: updatedBuildings.sm,
					pf: updatedBuildings.pf,
					tc: updatedBuildings.tc,
					asb: updatedBuildings.asb,
					ach: updatedBuildings.ach,
					queue: updatedBuildings.queue,
				});
			}
		}

		return { cursor: continueCursor, isDone };
	},
});

export const restartGame = action({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		await ctx.runMutation(internal.game.resetGameStatus);

		let isDone = false;
		while (!isDone) {
			const batchResult: { isDone: boolean } = await ctx.runMutation(
				internal.game.deleteEntitiesBatch,
			);
			isDone = batchResult.isDone;
		}

		return { success: true };
	},
});

export const resetGameStatus = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existingStatus = await ctx.db.query("gameStatus").first();
		if (existingStatus) {
			await ctx.db.patch(existingStatus._id, {
				currentTick: 0,
				roundNumber: (existingStatus.roundNumber ?? 1) + 1,
			});
		} else {
			await ctx.db.insert("gameStatus", {
				currentTick: 0,
				endTick: 20,
				roundNumber: 1,
			});
		}
	},
});

export const deleteEntitiesBatch = internalMutation({
	args: {},
	handler: async (ctx) => {
		const buildings = await ctx.db.query("buildings").take(1000);
		for (const bldg of buildings) {
			await ctx.db.delete(bldg._id);
		}

		const kingdoms = await ctx.db.query("kingdoms").take(1000);
		for (const kd of kingdoms) {
			await ctx.db.delete(kd._id);
		}

		return { isDone: buildings.length === 0 && kingdoms.length === 0 };
	},
});
