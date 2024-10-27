import { type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson } from 'remix-typedjson';
import { appState } from '~/app.service';
import { type PlanetType, type RaceType } from '~/kingdom';
import { kdUtil } from '~/kingdom/kd.util';
import { mapUtil } from '~/utils/map.util';

export interface WorldKingdom {
	id: number;
	name: string;
	x: number;
	y: number;
	land: number;
	nw: number;
	planet: PlanetType;
	race: RaceType;
}

export const worldLoader = async (args: LoaderFunctionArgs) => {
	const app = await appState();
	const kingdoms = mapUtil.toValues(app.kingdoms);
	const result: WorldKingdom[] = kingdoms.map(({ id }) => kdUtil.getWorldKingdom(id, app));
	return typedjson(result);
};
