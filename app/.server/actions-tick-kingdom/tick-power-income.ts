import { type KingdomFull } from '~/app.model';
import { GAME } from '~/game.const';
import { kdUtil } from '~/kingdom/kd.util';

export const tickPowerIncome = (kdFull: KingdomFull) => {
	const { plantOutput } = GAME.power;
	const production = kdFull.buildings.powerPlants * plantOutput;
	const consumption = kdUtil.getPowerConsumption(kdFull);

	return production - consumption;
};
