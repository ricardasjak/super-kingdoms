import { mutation } from "./_generated/server";

export const autoExploreMigration = mutation({
	args: {},
	handler: async (ctx) => {
		const records = await ctx.db.query("kingdoms").collect();
		let count = 0;
		for (const record of records) {
			const autoExplore = record.autoExplore as unknown;
			if (typeof autoExplore === "boolean") {
				await ctx.db.patch(record._id, {
					autoExplore: autoExplore ? 10 : 0,
				});
				count++;
			}
		}
		return `Migrated ${count} records to numeric autoExplore`;
	},
});

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
					r_dr: mapField(oldRes?.dr),
					r_ft: mapField(oldRes?.ft),
					r_tf: mapField(oldRes?.tf),
					r_ld: mapField(oldRes?.ld),
					r_lf: mapField(oldRes?.lf),
					r_f74: mapField(oldRes?.f74),
					r_ht: mapField(oldRes?.ht),
					r_fusion: mapField(oldRes?.fusion),
					r_core: mapField(oldRes?.core),
					r_armor: mapField(oldRes?.armor),
					r_long: mapField(oldRes?.long),
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
