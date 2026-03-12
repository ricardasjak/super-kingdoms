import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
	...authTables,
	kingdoms: defineTable({
		userId: v.string(),
		kdName: v.string(),
		rulerName: v.string(),
		planetType: v.string(),
		raceType: v.string(),
		population: v.number(),
		popChange: v.number(),
		land: v.number(),
		money: v.number(),
		power: v.number(),
		probes: v.number(),
		moneyIncome: v.number(),
		powerIncome: v.number(),
		scientists: v.number(),
		soldiers: v.number(),
		autoExplore: v.optional(v.boolean()),
		autoBuild: v.optional(v.boolean()),
		landQueue: v.array(v.number()),
		buildings: v.object({
			res: v.number(),
			plants: v.number(),
			rax: v.number(),
			sm: v.number(),
			pf: v.number(),
			tc: v.number(),
			asb: v.number(),
			ach: v.number(),
			rubble: v.number(),
			target: v.optional(
				v.object({
					res: v.number(),
					plants: v.number(),
					rax: v.number(),
					sm: v.number(),
					pf: v.number(),
					tc: v.number(),
					asb: v.number(),
					ach: v.number(),
				}),
			),
			queue: v.object({
				res: v.array(v.number()),
				plants: v.array(v.number()),
				rax: v.array(v.number()),
				sm: v.array(v.number()),
				pf: v.array(v.number()),
				tc: v.array(v.number()),
				asb: v.array(v.number()),
				ach: v.array(v.number()),
			}),
		}),
	}).index("by_userId", ["userId"]),
	gameStatus: defineTable({
		currentTick: v.number(),
		endTick: v.number(),
		roundNumber: v.number(),
	}),
});

export default schema;
