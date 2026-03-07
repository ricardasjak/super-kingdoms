import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
	...authTables,
	kingdoms: defineTable({
		userId: v.id("users"),
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
});

export default schema;
