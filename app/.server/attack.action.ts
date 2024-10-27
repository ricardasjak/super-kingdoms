import { type ActionFunctionArgs } from '@remix-run/node';
import { attackActionFn } from '~/.server/actions-attack/attack.action.fn';
import { type Attack, type AttackNews, KingdomFull, type Military } from '~/app.model';
import { appState } from '~/app.service';
import { GAME } from '~/game.const';

import { kdidLoaderFn, kingdomLoaderFn, targetLoaderFn } from '~/.server/kingdom.loader';
import { db } from '~/.server/db';
import { errorUtil, mapUtil, militaryUtil, now, randomNumber } from '~/utils';

export const attackAction = async (args: ActionFunctionArgs) => {
	const attackerId = await kdidLoaderFn(args);
	const targetId = await targetLoaderFn(args);
	const attacker = await kingdomLoaderFn(attackerId);
	const defender = await kingdomLoaderFn(targetId);
	const form = await args.request.formData();

	const soldiers = Number(form.get('soldiers')) || 0;
	const troopers = Number(form.get('troopers')) || 0;
	const tanks = Number(form.get('tanks')) || 0;
	// const sideStr = (form.get('side') || '') as string;
	// const side = SIDES.find(s => sideStr.toLowerCase() === s);
	// if (!side) {
	// 	throw new Error('Please, select attack direction: North, East, South or West');
	// }

	return await attackActionFn(soldiers, attacker, troopers, tanks, defender, attackerId, targetId);
};
