import { type KingdomFull } from '~/app.model';
import { kdUtil } from '~/kingdom/kd.util';

export const tickNetworth = (kd: KingdomFull) => {
	const { status, military, buildings } = kd;
	return Math.floor(kdUtil.getNetworth(status, buildings, military));
};
