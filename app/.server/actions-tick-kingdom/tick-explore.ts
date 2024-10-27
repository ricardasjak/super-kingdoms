import { GAME } from '~/game.const';

export const tickExplore = (land: number, exploreMoney: number) => {
	const { canExploreByLandLimit, canExploreByMoneyLimit } = GAME.explore;
	const explored = Math.min(
		canExploreByLandLimit(land),
		canExploreByMoneyLimit(land, exploreMoney)
	);
	return {
		explored,
		exploredCost: explored * GAME.explore.cost(land),
	};
};
