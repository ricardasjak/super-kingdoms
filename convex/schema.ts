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
		land: v.number(),
		money: v.number(),
		scientists: v.number(),
		soldiers: v.number(),
	}).index("by_userId", ["userId"]),
	buildings: defineTable({
		userId: v.string(),
		kdid: v.id("kingdoms"),
		res: v.number(),
		plants: v.number(),
		rax: v.number(),
		sm: v.number(),
		pf: v.number(),
		tc: v.number(),
		asb: v.number(),
		ach: v.number(),
		rubble: v.number(),
	})
		.index("by_kdid", ["kdid"])
		.index("by_userId", ["userId"]),
});

export default schema;
