import { type ActionFunction } from '@remix-run/node';
import { tickKingdom } from '~/.server/actions-tick-kingdom/tick';
import { appState } from '~/app.service';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { gameUtil } from '~/utils';

export const tickKingdomAction: ActionFunction = async args => {
	const kdid = await kdidLoaderFn(args);
	const kd = await kingdomLoaderFn(kdid);
	const form = await args.request.formData();
	let times = Number(form.get('times')) || 1;

	const maxTick = gameUtil(await appState()).getTicksLimit();
	if ((kd.status.tick || 1) > maxTick) {
		throw new Error('You cannot tick over the limit');
	}

	const limit = Math.min(maxTick, (kd.status.tick || 0) + times);
	times = limit - (kd.status.tick || 0);

	for (let i = 0; i < times; i++) {
		tickKingdom(kd);
	}
};
