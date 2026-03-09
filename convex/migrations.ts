import { mutation } from "./_generated/server";

export const runQueueMigration = mutation({
	args: {},
	handler: async (ctx) => {
		const buildings = await ctx.db.query("buildings").collect();

		let migratedCount = 0;

		for (const building of buildings) {
			if (building.queue === undefined) {
				await ctx.db.patch(building._id, {
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
				});
				migratedCount++;
			}
		}

		return `Migrated ${migratedCount} building records!`;
	},
});

export const runKingdomMigration = mutation({
	args: {},
	handler: async (ctx) => {
		const kingdoms = await ctx.db.query("kingdoms").collect();

		let migratedCount = 0;

		for (const kingdom of kingdoms) {
			if (kingdom.landQueue === undefined) {
				await ctx.db.patch(kingdom._id, {
					landQueue: [],
				});
				migratedCount++;
			}
		}

		return `Migrated ${migratedCount} kingdom records!`;
	},
});
