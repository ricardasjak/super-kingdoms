import { getAuthUserId } from "@convex-dev/auth/server";
import type { PropertyValidators } from "convex/values";
import { type MutationCtx, mutation } from "./_generated/server";

/**
 * A custom mutation wrapper that ensures:
 * 1. The user is authenticated.
 * 2. The user has a kingdom.
 * 3. The kingdom is NOT in a "dead" state.
 *
 * It provides the authenticated userId and the kingdom document to the handler.
 */
export function kingdomMutation<
	Args extends PropertyValidators,
	ReturnType,
>(object: {
	args: Args;
	handler: (
		ctx: MutationCtx,
		// biome-ignore lint/suspicious/noExplicitAny: <n/a>
		args: any, // Use any here to avoid complex intersection issues with Convex generic args
	) => Promise<ReturnType>;
}) {
	return mutation({
		args: object.args,
		// biome-ignore lint/suspicious/noExplicitAny: <n/a>
		handler: async (ctx, args: any) => {
			const userId = await getAuthUserId(ctx);
			if (!userId) {
				throw new Error("Not authenticated");
			}

			const kingdom = await ctx.db
				.query("kingdoms")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.unique();

			if (!kingdom) {
				throw new Error("Kingdom not found");
			}

			if (kingdom.state === "dead") {
				throw new Error("Kingdom is dead");
			}

			// Injected userId is always the authenticated string here
			return object.handler(ctx, {
				...args,
				kingdom,
				userId: userId as string,
			});
		},
	});
}
