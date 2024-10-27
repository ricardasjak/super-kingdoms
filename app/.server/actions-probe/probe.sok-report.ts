import { type KingdomStatus, type Military, type SOKReport } from '~/app.model';
import { kdUtil, type Kingdom } from '~/kingdom';
import { now } from '~/utils';

export const makeSOKReport = (kd: Kingdom, { probes, ...s }: KingdomStatus, military: Military) => {
	const sokReport: SOKReport = {
		name: kdUtil.getKingdomNameXY(kd),
		ruler: kd.ruler,
		...s,
		military,
		at: now(),
	};
	return sokReport;
};
