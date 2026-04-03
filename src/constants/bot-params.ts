/**
 * Bot profiles for AI-controlled kingdoms.
 * Exploration level sets auto epxloration, then buildings being built.
 * Remaining money spent on military and scientists, the sum should present 100 percent of the remaining cash.
 *
 */
export const BOT_PROFILES = {
	aggressive: {
		exploration: 1,
		offense: 30,
		defense: 30,
		flex: 32,
		science: 8,
		buildings: {
			pf: 5,
			tc: 10,
		},
	},
	probes: {
		exploration: 2,
		offense: 0,
		defense: 70,
		flex: 18,
		science: 12,
		buildings: {
			pf: 25,
			tc: 3,
		},
	},
	defensive: {
		exploration: 1,
		offense: 0,
		defense: 80,
		flex: 12,
		science: 8,
		buildings: {
			pf: 10,
			tc: 10,
		},
	},
	balanced: {
		exploration: 3,
		offense: 20,
		defense: 50,
		flex: 12,
		science: 18,
		buildings: {
			pf: 10,
			tc: 5,
		},
	},
	growth: {
		exploration: 4,
		offense: 0,
		defense: 70,
		flex: 10,
		science: 20,
		buildings: {
			pf: 5,
			tc: 0,
		},
	},
} as const;
