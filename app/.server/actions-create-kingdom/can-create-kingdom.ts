import { type AppState } from '~/app.model';
import { GAME } from '~/game.const';

export const canCreateKingdom = (app: AppState, playerId: number) => {
	const player = app.players.get(playerId);
	return !player || player.kingdoms.length < GAME.kingdomsLimit;
};
