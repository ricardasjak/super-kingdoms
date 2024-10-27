import { type LoaderFunction } from '@remix-run/node';
import { typedjson } from 'remix-typedjson';
import { appState } from '~/app.service';
import { mapUtil } from '~/utils/map.util';

export const getAllKingdomsLoader: LoaderFunction = async () => {
	const app = await appState();
	const kingdoms = mapUtil.toValues(app.kingdoms);
	return typedjson(kingdoms);
};
