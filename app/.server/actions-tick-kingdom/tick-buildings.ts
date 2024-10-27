import { type BuildingsPlan, type Buildings } from '~/app.model';
import { GAME } from '~/game.const';
import { kdUtil } from '~/kingdom/kd.util';

const empty: BuildingsPlan = {
	residences: 0,
	barracks: 0,
	powerPlants: 0,
	starMines: 0,
	trainingCamps: 0,
	probeFactories: 0,
};

export const tickBuildings = (
	landNext: number,
	budget: number,
	buildings: Buildings,
	plan: BuildingsPlan
) => {
	const freeLand = landNext - kdUtil.builtLand(buildings);
	if (freeLand <= 0) {
		return {
			constructed: { ...empty },
			constructionCost: 0,
		};
	}

	const { cost } = GAME.building;
	const buildingCost = cost(landNext);
	const canAffordToBuild = Math.min(freeLand, Math.floor(budget / buildingCost));

	if (!canAffordToBuild) {
		return {
			constructed: empty,
			constructionCost: 0,
		};
	}

	const planned: BuildingsPlan = (Object.keys(plan) as Array<keyof BuildingsPlan>).reduce(
		(result, type) => {
			result[type] = (landNext * plan[type]) / 100;
			return result;
		},
		{ ...empty }
	);
	const target: BuildingsPlan = (Object.keys(plan) as Array<keyof BuildingsPlan>).reduce(
		(result, type) => {
			result[type] = Math.max(0, planned[type] - buildings[type]);
			return result;
		},
		{ ...empty }
	);
	const targetLand = kdUtil.builtLand(target);
	const ratio = Math.min(1, canAffordToBuild / targetLand);

	let freeLandLeft = freeLand;
	const constructed: BuildingsPlan = (Object.keys(plan) as Array<keyof BuildingsPlan>).reduce(
		(result, type) => {
			if (freeLandLeft <= 0) return result;
			result[type] = Math.round(target[type] * ratio);
			result[type] = Math.min(freeLandLeft, result[type]);
			freeLandLeft = freeLandLeft - result[type];
			return result;
		},
		{ ...empty }
	);

	return {
		constructed,
		constructionCost: buildingCost * kdUtil.builtLand(constructed),
	};
};
