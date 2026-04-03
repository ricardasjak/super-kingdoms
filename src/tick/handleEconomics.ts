import { GAME_PARAMS } from "../constants/game-params";
import type { BuildingState, KingdomSettings, MilitaryUnits } from "./types";

export type EconomicsUpdate = Pick<
	KingdomSettings,
	"money" | "moneyIncome" | "power" | "powerIncome" | "probes"
>;

/**
 * Calculates money income and power balance.
 */
export function handleEconomics(
	kingdom: KingdomSettings,
	buildings: BuildingState,
	military: MilitaryUnits,
): EconomicsUpdate {
	const bonuses = {
		money: (kingdom.research.money?.perc ?? 0) / 100,
		power: (kingdom.research.power?.perc ?? 0) / 100,
		fusion:
			(kingdom.research.r_fusion?.perc ?? 0) >= 100
				? (GAME_PARAMS.militaryTechTree.r_fusion?.bonus ?? 0) / 100
				: 0,
		core:
			(kingdom.research.r_core?.perc ?? 0) >= 100
				? (GAME_PARAMS.militaryTechTree.r_core?.bonus ?? 0) / 100
				: 0,
	};

	const moneyIncome = Math.round(
		(buildings.sm * GAME_PARAMS.income.sm +
			kingdom.population * GAME_PARAMS.income.population) *
			(1 + bonuses.money),
	);

	const powerConsumption =
		kingdom.population * GAME_PARAMS.power.consumption.population +
		(
			Object.keys(GAME_PARAMS.military.units) as Array<
				keyof typeof GAME_PARAMS.military.units
			>
		).reduce((acc, key) => {
			return (
				acc +
				(military[key] || 0) * (GAME_PARAMS.military.units[key].power || 0)
			);
		}, 0);

	const powerIncome = Math.round(
		buildings.plants *
			GAME_PARAMS.buildings.plantProduction *
			(1 + bonuses.power + bonuses.fusion + bonuses.core) -
			powerConsumption,
	);

	const money = kingdom.money + moneyIncome;
	const power = Math.min(
		GAME_PARAMS.buildings.plantStorage * buildings.plants,
		Math.max(0, Math.round(kingdom.power + powerIncome)),
	);
	const probes = kingdom.probes + buildings.pf;

	return {
		money,
		moneyIncome,
		power,
		powerIncome: Math.round(powerIncome),
		probes,
	};
}
