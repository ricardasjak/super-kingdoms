import { GAME } from '~/game.const';

export const tickIncome = (population: number, starmines: number) => {
	const { pop, sm } = GAME.income;

	return Math.floor(population * pop + starmines * sm);
};
