import { db } from '~/.server/db';
import { type AppState } from '~/app.model';
import { kdUtil } from '~/kingdom';
import { mapUtil } from '~/utils/map.util';

declare global {
	var __appState__: AppState;
}

if (!global.__appState__) {
	global.__appState__ = {
		status: 'empty',
		rounds: new Map(),
		users: new Map(),
		players: new Map(),
		kingdoms: new Map(),
		kingdomsStatus: new Map(),
		budgets: new Map(),
		buildings: new Map(),
		buildingsPlan: new Map(),
		defence: new Map(),
		military: new Map(),
		militaryPlan: new Map(),
		probings: new Map(),
		news: new Map(),
		attacks: new Map(),
	};
}

export const printStatus = () => {
	const app = mapUtil.toAppStateObject(global.__appState__);
	const summary = [
		'app state',
		`app state - rounds count: ${app.rounds.length}`,
		`app state - users count: ${app.users.length}`,
		`app state - players count: ${app.players.length}`,
		`app state - kingdoms count: ${app.kingdoms.length}`,
		`app state - kingdoms status count: ${app.status.length}`,
		`app state - budgets count: ${app.budgets.length}`,
		`app state - buildings count: ${app.buildings.length}`,
		`app state - buildingsPlan count: ${app.buildingsPlan.length}`,
		`app state - defence count: ${app.defence.length}`,
		`app state - military count: ${app.military.length}`,
		`app state - militaryPlan count: ${app.militaryPlan.length}`,
		`app state - probings count: ${app.probings.reduce((acc, p) => acc + p.size, 0)}`,
		`app state - news count: ${app.news.reduce((acc, p) => acc + p.size, 0)}`,
		`app state - attacks count: ${app.attacks.reduce((acc, p) => acc + p.size, 0)}`,
	].join('\n');
	console.info(summary);
	return summary;
};

export const appState = async (): Promise<AppState> => {
	const app = global.__appState__;
	if (app.status === 'empty') {
		app.status = 'loading';
		console.time('*** Loading database ***');
		const [
			rounds,
			users,
			players,
			kingdoms,
			statuses,
			defence,
			budget,
			buildings,
			bplans,
			military,
			mplans,
		] = await Promise.all([
			db.round.loadAll(),
			db.user.loadAll(),
			db.player.loadAll(),
			db.kingdom.loadAll(),
			db.kingdomStatus.loadAll(),
			db.defence.loadAll(),
			db.budget.loadAll(),
			db.buildings.loadAll(),
			db.buildingsPlan.loadAll(),
			db.military.loadAll(),
			db.militaryPlan.loadAll(),
		]);

		try {
			// app.rounds = await db.round.loadAll(app.rounds);
			// app.users = await db.user.loadAll(app.users);
			// app.players = await db.player.loadAll(app.players);
			// app.kingdoms = await db.kingdom.loadAll(app.kingdoms);
			// app.kingdomsStatus = await db.kingdomStatus.loadAll(app.kingdomsStatus);
			// app.defence = await db.defence.loadAll(app.defence);
			// app.budgets = await db.budget.loadAll(app.budgets);
			// app.buildings = await db.buildings.loadAll(app.buildings);
			// app.buildingsPlan = await db.buildingsPlan.loadAll(app.buildingsPlan);
			// app.military = await db.military.loadAll(app.military);
			// app.militaryPlan = await db.militaryPlan.loadAll(app.militaryPlan);
			// app.news = await db.news.loadAll(app.news);

			app.rounds = rounds;
			app.users = users;
			app.players = players;
			app.kingdoms = kingdoms;
			app.kingdomsStatus = statuses;
			app.defence = defence;
			app.budgets = budget;
			app.buildings = buildings;
			app.buildingsPlan = bplans;
			app.military = military;
			app.militaryPlan = mplans;

			console.info('*** Main data loaded ***');
			let idsAll = mapUtil.toKeys(app.kingdoms);
			if (process.env.MAX_KINGDOMS_COUNT) {
				idsAll = idsAll.slice(0, parseInt(process.env.MAX_KINGDOMS_COUNT));
			}
			console.log('*** Kingdoms count to load:', idsAll.length);

			const size = 50;
			let n = Math.ceil(idsAll.length / size);
			let m = 0;
			while (m < n) {
				const ids = idsAll.slice(m * size, (m + 1) * size);
				console.log(
					'*** Loading Kingdoms:',
					`${ids[0]} ... ${ids[ids.length - 1]}, ${Math.ceil((m / n) * 100)}%`
				);
				m = m + 1;
				const promisesProbes = ids.map(id => {
					app.probings.set(id, new Map());
					return db.probings(id).loadAll();
				});
				const probings = await Promise.all(promisesProbes);
				probings.forEach((p, index) => {
					app.probings.set(ids[index], p);
				});

				const promisesNews = ids.map(id => {
					app.news.set(id, new Map());
					return db.news(id).loadAll();
				});
				const news = await Promise.all(promisesNews);
				news.forEach((n, index) => {
					app.news.set(ids[index], n);
				});

				const promisesAttacks = ids.map(id => {
					app.attacks.set(id, new Map());
					return db.attacks(id).loadAll();
				});
				const attacks = await Promise.all(promisesAttacks);
				attacks.forEach((a, index) => {
					app.attacks.set(ids[index], a);
				});
			}
			console.timeEnd('*** Loading database ***');
			ensureDataModel(app);
			app.status = 'ready';
			console.info('*** App is READY ***');
		} catch (ex) {
			console.error(ex);
		}
	} else if (app.status === 'loading') {
		return new Promise(resolve => {
			const int = setInterval(() => {
				if (app.status === 'ready') {
					clearInterval(int);
					console.info('finally loaded');
					printStatus();
					resolve(app);
				} else {
					console.info('loading state...');
				}
			}, 1000);

			setTimeout(() => {
				clearInterval(int);
			}, 5000);
		});
	}
	return app;
};

const ensureDataModel = (app: AppState) => {
	const kingdoms = mapUtil.toValues(app.kingdoms);
	const { defence } = kdUtil.getKingdomDefaults();
	kingdoms.forEach(kd => {
		const kdFull = kdUtil.getFullKingdom(kd.id, app);
		if (!app.defence.get(kd.id)) {
			app.defence.set(kd.id, { ...defence });
		}

		kdFull.status.attackMeter = kdFull.status.attackMeter || 100;
		kdFull.status.tick = kdFull.status.tick || 1;
		kdFull.status.attempts = kdFull.status.attempts || 0;
		kdFull.status.lastNewsId = kdFull.status.lastNewsId || -1;

		// @ts-ignore
		delete kdFull.status.probings;
		// @ts-ignore
		delete kdFull.status.attacks;
	});
};
