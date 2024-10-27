import { type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson } from 'remix-typedjson';
import { appState } from '~/app.service';
import { kdUtil } from '~/kingdom/kd.util';
import { authLoader } from '~/loaders/auth.loader';
import { mapUtil } from '~/utils';

/**
 * Loads list of player kingdoms
 * @param args
 */
export const playerKingdomsLoader = async (args: LoaderFunctionArgs) => {
	const session = await authLoader(args);
	if (!session) {
		return typedjson([]);
	}
	const data = await playerKingdomsLoaderFn(session.userId);
	return typedjson(data);
};

export interface PlayerKingdom {
	id: number;
	name: string;
	news: number;
}

export const playerKingdomsLoaderFn = async (userId: number): Promise<PlayerKingdom[]> => {
	const app = await appState();
	const player = mapUtil.toValues(app.players).find(p => p.userId === userId);
	if (!player) {
		return [];
	}
	return player.kingdoms
		.map(id => {
			const kd = kdUtil.getFullKingdom(id, app);
			const { name } = kd.kingdom;
			const { lastNewsId } = kd.status;
			const unreadNews = kd.news.filter(n => n.id > lastNewsId).length;
			return {
				id,
				name,
				news: unreadNews,
			};
		})
		.filter(Boolean);
};

export const validatePlayerKingdom = async (userId: number, kdid: number) => {
	const kingdoms = await playerKingdomsLoaderFn(userId);
	if (!kingdoms.find(kd => kd.id === kdid)) {
		throw new Error('Kingdom not found');
	}
	return true;
};
