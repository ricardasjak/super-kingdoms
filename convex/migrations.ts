/** biome-ignore-all lint/suspicious/noExplicitAny: <it's ok> */
import { mutation } from "./_generated/server";

export const runResearchMigration = mutation({
	args: {},
	handler: async (ctx) => {
		const records = await ctx.db.query("kingdoms").collect();
		let count = 0;
		for (const record of records) {
			const oldRes = record.research as Record<string, unknown>;

			const mapField = (field: unknown) => {
				if (typeof field === "number") return { pts: field, perc: 0 };
				if (
					field &&
					typeof field === "object" &&
					"pts" in field &&
					"perc" in field
				)
					return field as { pts: number; perc: number };
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
					dr: mapField(oldRes?.dr),
					ft: mapField(oldRes?.ft),
					tf: mapField(oldRes?.tf),
					ld: mapField(oldRes?.ld),
					lf: mapField(oldRes?.lf),
					f74: mapField(oldRes?.f74),
					hgl: mapField(oldRes?.hgl),
					ht: mapField(oldRes?.ht),
				},
				researchPts:
					(oldRes?.researchPts as number | undefined) ??
					record.researchPts ??
					0,
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
