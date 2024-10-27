import { type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson } from 'remix-typedjson';
import { tickNextKingdom } from '~/.server/actions-tick-kingdom/tick';
import { appState } from '~/app.service';
import { kdUtil } from '~/kingdom/kd.util';
import { authRequiredLoader } from '~/loaders';
import { gameUtil, mapUtil } from '~/utils';

/**
 * Loads kingdom data by kdid from the route params
 * @param args
 */
export const kingdomLoader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const ticksLimit = gameUtil(await appState()).getTicksLimit();
	// const ticksLimit = Math.ceil(Math.random() * 1000);
	const { kingdom, status } = await kingdomLoaderFn(kdid);

	return typedjson({ kingdom, status, ticksLimit });
};

export const kdidLoaderFn = async (args: LoaderFunctionArgs) => {
	const session = await authRequiredLoader(args);
	const kdid = Number(args.params.kdid);
	if (!kdid) {
		throw new Error('Kingdom not found');
	}
	const app = await appState();
	const player = mapUtil.toValues(app.players).find(p => p.userId === session.userId);
	if (!player || !player.kingdoms.includes(kdid)) {
		throw new Error('This kingdom does not belong to your account!');
	}
	return kdid;
};

export const targetLoaderFn = async (args: LoaderFunctionArgs) => {
	const target = Number(args.params.target);
	if (!target) {
		throw new Error('Target kingdom not found');
	}
	return target;
};

export const kingdomLoaderFn = async (kdid: number) => {
	const app = await appState();
	return kdUtil.getFullKingdom(kdid, app);
};

export const kingdomNextLoaderFn = async (kdid: number) => {
	const kd = await kingdomLoaderFn(kdid);
	return tickNextKingdom(kd);
};
