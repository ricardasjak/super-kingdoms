import { expect, test } from "vitest";
import { processKingdomTick } from "./tickUtils";
import { GAME_PARAMS } from "../constants/game-params";
import type { KingdomSettings, BuildingState, MilitaryUnits } from "./tickUtils";

test("money research bonus applies in the same tick it is reached", () => {
    // 1. Setup a basic kingdom at 250 land
    const land = 250;
    const initialPopulation = 2250;
    const smCount = 30;
    
    // Money research required at 250 land is ~334 points
    const requiredPoints = GAME_PARAMS.research.required("money", land);
    
    const kingdom: KingdomSettings = {
        population: initialPopulation,
        land: land,
        money: 10000,
        power: 1000,
        probes: 0,
        moneyIncome: 0,
        powerIncome: 0,
        landQueue: [],
        researchPts: 0,
        researchAutoAssign: ["money"],
        research: {
            pop: { pts: 0, perc: 0 },
            money: { pts: 0, perc: 0 },
            power: { pts: 0, perc: 0 },
            mil: { pts: 0, perc: 0 },
            fdc: { pts: 0, perc: 0 },
            warp: { pts: 0, perc: 0 },
        },
    };

    const buildings: BuildingState = {
        res: 40,
        plants: 10,
        rax: 10,
        sm: smCount,
        pf: 0,
        tc: 0,
        asb: 0,
        ach: 0,
        rubble: 0,
        queue: {
            res: [], plants: [], rax: [], sm: [], pf: [], tc: [], asb: [], ach: []
        }
    };

    // Have exactly enough scientists to max out money research in one tick
    const military: MilitaryUnits = {
        sol: 1000, tr: 0, dr: 0, ft: 0, tf: 0, lt: 0, ld: 0, lf: 0, f74: 0, t: 0, ht: 0,
        sci: requiredPoints, // Scientists produce points equal to their count
        queue: {
            sol: [], tr: [], dr: [], ft: [], tf: [], lt: [], ld: [], lf: [], f74: [], t: [], ht: [], sci: []
        }
    };

    // Calculate expected income without bonus
    const baseIncome = Math.round(
        (smCount * GAME_PARAMS.income.sm + initialPopulation * GAME_PARAMS.income.population)
    );
    
    // Math.round((30 * 140 + 2250 * 2)) = 4200 + 4500 = 8700
    expect(baseIncome).toBe(8700);

    // 2. Process Tick
    const result = processKingdomTick(kingdom, buildings, military);
    const updatedKingdom = result.updatedKingdom;

    // 3. Verify Research was updated
    expect(updatedKingdom.research.money?.pts).toBe(requiredPoints);
    expect(updatedKingdom.research.money?.perc).toBe(GAME_PARAMS.research.params.money.bonus); // Should be 25

    // 4. Verify Income was boosted in SAME tick
    const expectedBonus = GAME_PARAMS.research.params.money.bonus / 100; // 0.25
    const expectedBoostedIncome = Math.round(baseIncome * (1 + expectedBonus));
    
    // 8700 * 1.25 = 10875
    expect(updatedKingdom.moneyIncome).toBe(expectedBoostedIncome);
    expect(updatedKingdom.money).toBe(kingdom.money + expectedBoostedIncome);
});
