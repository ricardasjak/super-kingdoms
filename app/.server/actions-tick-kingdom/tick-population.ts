import { GAME } from '~/game.const';

export const tickPopulation = (
	currentPopulation: number,
	residences: number,
	land: number,
	unsupportedMilitary: number
) => {
	const { growthRatio, residenceCapacity, lossRatio, lossPerLandRatio, lossMinimum } = GAME.pop;
	const militaryResidences = Math.ceil(unsupportedMilitary / GAME.pop.residenceForMilitary);
	const maxPop = (residences - militaryResidences) * residenceCapacity;

	let result = currentPopulation;
	if (maxPop >= currentPopulation) {
		const maxGrowth = currentPopulation * growthRatio;
		result = Math.min(currentPopulation + maxGrowth, maxPop);
	} else {
		let maxLoss = Math.max(currentPopulation * lossRatio, land * lossPerLandRatio);
		maxLoss = Math.min(maxLoss, lossMinimum);
		result = currentPopulation - maxLoss;
	}
	return Math.round(result);
};
