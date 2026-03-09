import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { processKingdomTick } from "../src/utils/tickUtils";

export const getGameStatus = query({
	args: {},
	handler: async (ctx) => {
		const existingStatus = await ctx.db.query("gameStatus").first();
		if (!existingStatus) {
			return { currentTick: 0, endTick: 20 };
		}
		return existingStatus;
	},
});

export const advanceTick = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const startTime = Date.now();

		const existingStatus = await ctx.db.query("gameStatus").first();
		const status =
			existingStatus ??
			(await ctx.db.get(
				await ctx.db.insert("gameStatus", {
					currentTick: 0,
					endTick: 20,
				}),
			));

		if (!status || status.currentTick >= status.endTick) {
			throw new Error("Game has reached the maximum number of ticks.");
		}

		// Increment tick
		await ctx.db.patch(status._id, { currentTick: status.currentTick + 1 });

		// Fetch all kingdoms and process
		const kingdoms = await ctx.db.query("kingdoms").collect();

		for (const kingdom of kingdoms) {
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

		const endTime = Date.now();
		const finalExecutionTime = endTime - startTime;

		return {
			executionTimeMs: finalExecutionTime,
		};
	},
	returns: v.object({
		executionTimeMs: v.number(),
	}),
});
