import { type AppState, type Player, type User } from '~/app.model';
import { canCreateKingdom } from './can-create-kingdom';
import { makeCoords } from './make-coords';
import { kdUtil } from '~/kingdom/kd.util';
import { type CreateKingdom, type Kingdom } from '~/kingdom/kingdom.model';

import { db } from '~/.server/db';
import { now } from '~/utils';
import { mapUtil } from '~/utils/map.util';

export const createKingdomFn = async (
	app: AppState,
	kd: CreateKingdom,
	user: User,
	round: number
) => {
	const id = mapUtil.nextKey(app.kingdoms);
	const newKingdom: Kingdom = {
		id,
		...kd,
		created: now(),
		updated: now(),
		userId: user.id,
		galaxy: 1,
		nickname: '',
		sector: 1,
		...makeCoords(),
		roundId: round,
	};

	let player = mapUtil.toValues(app.players).find(p => p.round === round && p.userId === user.id);
	if (!player) {
		const playerId = mapUtil.nextKey(app.players);
		const newPlayer: Player = { id: playerId, userId: user.id, round: round, kingdoms: [] };
		app.players.set(playerId, newPlayer);
		player = newPlayer;
		await db.player.createOne(player.id, player);
	}

	if (!canCreateKingdom(app, player.id)) {
		throw 'Kingdoms limit reached';
	}

	app.kingdoms.set(id, newKingdom);
	player.kingdoms.push(id);

	const { budget, buildings, buildingsPlan, military, militaryPlan, kingdomStatus } =
		kdUtil.getKingdomDefaults();

	app.budgets.set(id, budget);
	app.buildings.set(id, buildings);
	app.buildingsPlan.set(id, buildingsPlan);
	app.military.set(id, military);
	app.militaryPlan.set(id, militaryPlan);
	app.kingdomsStatus.set(id, kingdomStatus);
	app.news.set(id, new Map());
	app.attacks.set(id, new Map());
	app.probings.set(id, new Map());

	await db.kingdom.createOne(id, newKingdom);
	await db.player.saveOne(player.id, player);
	await db.budget.saveOne(id, budget);
	await db.buildings.saveOne(id, buildings);
	await db.buildingsPlan.saveOne(id, buildingsPlan);
	await db.military.saveOne(id, military);
	await db.militaryPlan.saveOne(id, militaryPlan);
	await db.kingdomStatus.saveOne(id, kingdomStatus);
	console.info('action: kd successfully created!');
	return newKingdom;
};
