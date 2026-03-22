/** biome-ignore-all lint/suspicious/noExplicitAny: <it's ok> */
import { mutation } from "./_generated/server";

export const runResearchMigration = mutation({
	args: {},
	handler: async (ctx) => {
		const records = await ctx.db.query("kingdoms").collect();
		let count = 0;
		for (const record of records) {
			const oldRes = record.research as any;

			const mapField = (field: any) => {
				if (typeof field === "number") return { pts: field, perc: 0 };
				if (field && typeof field === "object") return field;
				return { pts: 0, perc: 0 };
			};

			await ctx.db.patch(record._id, {
				research: {
					pop: mapField(oldRes?.pop),
					power: mapField(oldRes?.power),
					mil: mapField(oldRes?.mil),
					money: mapField(oldRes?.money),
					fdc: mapField(oldRes?.fdc),
					warp: mapField(oldRes?.warp),
				},
				researchPts: oldRes?.researchPts ?? record.researchPts ?? 0,
			});
			count++;
		}
		return `Migrated ${count} records in kingdoms`;
	},
});
export const backfillResearchAutoAssign = mutation({
	args: {},
	handler: async (ctx) => {
		const records = await ctx.db.query("kingdoms").collect();
		let count = 0;
		for (const record of records) {
			if (record.researchAutoAssign === undefined) {
				await ctx.db.patch(record._id, {
					researchAutoAssign: [],
				});
				count++;
			}
		}
		return `Backfilled ${count} records with researchAutoAssign`;
	},
});
