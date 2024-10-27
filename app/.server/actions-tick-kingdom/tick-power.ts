import { GAME } from '~/game.const';

export const tickPower = (power: number, powerChange: number, powerPlants: number) => {
	const storage = powerPlants * GAME.power.plantStorage;
	return Math.min(Math.max(0, power + powerChange), storage);
};
