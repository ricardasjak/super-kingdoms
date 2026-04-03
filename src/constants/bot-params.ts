const DEFAULT_RESEARCH_PRIORITY = [
	"mil",
	"money",
	"warp",
	"pop",
	"power",
	"r_fusion",
	"r_long",
	"r_core",
	"r_ld",
	"r_lf",
	"r_armor",
	"r_dr",
	"r_ft",
	"r_f74",
	"r_tf",
	"r_ht",
];

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
		researchPriority: [
			"mil",
			"money",
			"warp",
			"pop",
			"r_fusion",
			"r_core",
			"r_long",
			"r_ld",
			"r_dr",
			"r_armor",
			"r_ft",
			"r_tf",
			"r_lf",
			"r_f74",
			"r_ht",
		],
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
		researchPriority: [
			"mil",
			"money",
			"warp",
			"pop",
			"r_fusion",
			"r_core",
			"r_armor",
			"r_long",
			"r_ld",
			"r_dr",
			"r_ft",
			"r_tf",
			"r_lf",
			"r_f74",
			"r_ht",
		],
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
		researchPriority: DEFAULT_RESEARCH_PRIORITY,
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
		researchPriority: DEFAULT_RESEARCH_PRIORITY,
	},
	nwBooster: {
		exploration: 1,
		offense: 0,
		defense: 0,
		flex: 100,
		science: 0,
		buildings: {
			pf: 0,
			tc: 0,
		},
		researchPriority: DEFAULT_RESEARCH_PRIORITY,
	},
	growth: {
		exploration: 4,
		offense: 0,
		defense: 75,
		flex: 12,
		science: 13,
		buildings: {
			pf: 5,
			tc: 0,
		},
		researchPriority: DEFAULT_RESEARCH_PRIORITY,
	},
	growthMax: {
		exploration: 4,
		offense: 0,
		defense: 75,
		flex: 0,
		science: 25,
		buildings: {
			pf: 5,
			tc: 0,
		},
		researchPriority: DEFAULT_RESEARCH_PRIORITY,
	},
} as const;

export const BOT_PARAMS = {
	soldiersLimitPerLand: 4,
	soldiersMinimum: 4000,
};
