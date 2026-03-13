import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { GAME_PARAMS } from "../src/constants/game-params";
import { processKingdomTick } from "../src/utils/tickUtils";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

export const getGameStatus = query({
	args: {},
	handler: async (ctx) => {
		const existingStatus = await ctx.db.query("gameStatus").first();
		if (!existingStatus) {
			return {
				currentTick: 0,
				endTick: GAME_PARAMS.roundLength,
				roundNumber: 1,
			};
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

		let isDone = false;
		let cursor: string | null = null;

		while (!isDone) {
			const batchResult: { isDone: boolean; continueCursor: string } =
				await ctx.runMutation(internal.game.processBatch, { cursor });
			isDone = batchResult.isDone;
			cursor = batchResult.continueCursor;
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
					endTick: GAME_PARAMS.roundLength,
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
		const results = await ctx.db
			.query("kingdoms")
			.paginate({ cursor: args.cursor, numItems: 3000 });

		await Promise.all(
			results.page.map(async (kingdom) => {
				const buildings = kingdom.buildings;
				const military = kingdom.military;

				if (!buildings) return;

				const { updatedKingdom, updatedBuildings, updatedMilitary } =
					processKingdomTick(kingdom, buildings, military);

				const patchData: Parameters<typeof ctx.db.patch>[1] = {
					money: updatedKingdom.money,
					population: updatedKingdom.population,
					popChange: updatedKingdom.popChange,
					power: updatedKingdom.power,
					probes: updatedKingdom.probes,
					moneyIncome: updatedKingdom.moneyIncome,
					powerIncome: updatedKingdom.powerIncome,
					land: updatedKingdom.land,
					landQueue: updatedKingdom.landQueue,
				};

				if (updatedBuildings) {
					patchData.buildings = updatedBuildings;
				}

				if (updatedMilitary) {
					patchData.military = updatedMilitary;
				}

				await ctx.db.patch(kingdom._id, patchData);
			}),
		);

		return { isDone: results.isDone, continueCursor: results.continueCursor };
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
				endTick: GAME_PARAMS.roundLength,
			});
		} else {
			await ctx.db.insert("gameStatus", {
				currentTick: 0,
				endTick: GAME_PARAMS.roundLength,
				roundNumber: 1,
			});
		}
	},
});

export const deleteEntitiesBatch = internalMutation({
	args: {},
	handler: async (ctx) => {
		const kingdoms = await ctx.db.query("kingdoms").take(1000);
		await Promise.all(kingdoms.map((kd) => ctx.db.delete(kd._id)));

		return { isDone: kingdoms.length === 0 };
	},
});
