import { expect, test } from "vitest";
import type { BuildingType } from "../../types/game";
import type { BuildingState, KingdomSettings } from "../types";
import { handleAutoGrowth } from "./handleAutoGrowth";

test("handleAutoGrowth handles exploration and buildings together", () => {
	const buildKeys: BuildingType[] = ["res"];
	const kingdom: Pick<KingdomSettings, "autoBuild" | "autoExplore" | "land" | "money" | "landQueue"> = {
		autoBuild: true,
		autoExplore: 10,
		land: 1000,
		money: 1000000,
		landQueue: [],
	};

	const buildings: BuildingState = {
		res: 10, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0, rubble: 0,
		target: {
			res: 50, // 500 res target. Current 10.
			plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0
		},
		queue: {
			res: [], plants: [], rax: [], sm: [], pf: [], tc: [], asb: [], ach: []
		}
	};

	const result = handleAutoGrowth(kingdom, buildings, buildKeys);

	expect(result.changed).toBe(true);
	
	// Explore 10% of 1000 = 100. Rounded to 24 = 96.
	const exploreQueued = result.landQueue.reduce((a, b) => a + b, 0);
	expect(exploreQueued).toBe(96);

	// Build res
	const resQueued = result.buildingQueue.res.reduce((a, b) => a + b, 0);
	expect(resQueued).toBeGreaterThan(0);

	expect(result.money).toBeLessThan(1000000);
});

test("handleAutoGrowth is limited by money across both actions", () => {
    const buildKeys: BuildingType[] = ["res"];
    const kingdom: Pick<KingdomSettings, "autoBuild" | "autoExplore" | "land" | "money" | "landQueue"> = {
        autoBuild: true,
        autoExplore: 10,
        land: 1000,
        money: 0, // No money
        landQueue: [],
    };

    const buildings: BuildingState = {
        res: 0, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0, rubble: 0,
        target: { res: 10, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0 },
        queue: { res: [], plants: [], rax: [], sm: [], pf: [], tc: [], asb: [], ach: [] }
    };

    const result = handleAutoGrowth(kingdom, buildings, buildKeys);
    expect(result.changed).toBe(false);
    expect(result.money).toBe(0);
});

test("handleAutoGrowth respects autoBuild and autoExplore toggles", () => {
    const buildKeys: BuildingType[] = ["res"];
    const kingdom: Pick<KingdomSettings, "autoBuild" | "autoExplore" | "land" | "money" | "landQueue"> = {
        autoBuild: false,
        autoExplore: 0,
        land: 1000,
        money: 1000000,
        landQueue: [],
    };

    const buildings: BuildingState = {
        res: 0, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0, rubble: 0,
        target: { res: 100, plants: 0, rax: 0, sm: 0, pf: 0, tc: 0, asb: 0, ach: 0 },
        queue: { res: [], plants: [], rax: [], sm: [], pf: [], tc: [], asb: [], ach: [] }
    };

    const result = handleAutoGrowth(kingdom, buildings, buildKeys);
    expect(result.changed).toBe(false);
});
