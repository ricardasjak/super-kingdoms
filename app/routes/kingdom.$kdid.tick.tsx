import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';

import { typedjson } from 'remix-typedjson';
import { kdidLoaderFn, kingdomNextLoaderFn } from '~/.server/kingdom.loader';
import { tickKingdomAction } from '~/.server/tick-kingdom.action';

export const action = async (args: ActionFunctionArgs) => {
	await tickKingdomAction(args);
	return typedjson({ ok: true });
};

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const next = await kingdomNextLoaderFn(kdid);
	return typedjson(next);
};
