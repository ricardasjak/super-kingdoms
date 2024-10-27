import { type AppState } from '~/app.model';
import { GAME } from '~/game.const';

export const gameUtil = (app: AppState) => ({
	getTicksLimit: () => {
		// const rounds = mapUtil.toValues(app.rounds);
		// const round = rounds[rounds.length - 1];
		const { round } = GAME;
		if (!round) return 0;
		const now = new Date().getTime();

		return Math.floor((now - round.startAt) / (round.tickLength * 60_000));
	},
});
