import { type Attack, type AttackNews, KingdomFull, type Military } from '~/app.model';
import { appState } from '~/.server/app.service';
import { GAME } from '~/game.const';

import { db } from '~/.server/db';
import { errorUtil, mapUtil, militaryUtil, now, randomNumber } from '~/utils';

export const attackActionFn = async (
	soldiers: number,
	attacker: KingdomFull,
	troopers: number,
	tanks: number,
	defender: KingdomFull,
	attackerId: number,
	targetId: number
) => {
	if (
		soldiers > (attacker.military.sold || 0) ||
		troopers > (attacker.military.tr || 0) ||
		tanks > (attacker.military.t || 0)
	) {
		errorUtil.throwUserError(`You don't have that many units to send.`);
	}

	if (attacker.status.attackMeter < GAME.military.attackMeterCostPerAttack) {
		errorUtil.throwUserError(
			`Your attack meter ${attacker.status.attackMeter}% hasn't reached required value of ${GAME.military.attackMeterCostPerAttack}%. Advance few more ticks before trying again.`
		);
	}

	const app = await appState();

	const attackerMilitary: Military = {
		sold: soldiers,
		tr: troopers,
		t: tanks,
		sci: undefined,
		ld: undefined,
		dr: undefined,
		lt: undefined,
	};

	const attackerPoints = militaryUtil.getAttackerPoints(
		attackerMilitary,
		attacker.status.power === 0
	);
	const defenderPoints = militaryUtil.getDefensePoints(
		defender.military,
		defender.status.power === 0
	);
	const successPercentage = militaryUtil.getAttackSuccessChance(attackerPoints, defenderPoints);
	const successNumber = randomNumber();
	const success = successPercentage >= successNumber;

	const attackerLossesRatio = militaryUtil.getAttackLossRatio(
		attackerPoints,
		defenderPoints,
		success
	);
	const attackerLosses = militaryUtil.getAttackerLostUnits(attackerMilitary, attackerLossesRatio);

	const defenderLossesRatio = militaryUtil.getDefenderLossRatio(
		attackerPoints,
		defenderPoints,
		success
	);
	const defenderMilitary = { ...defender.military };
	const defenderLosses = militaryUtil.getDefenderLostUnits(defenderMilitary, defenderLossesRatio);

	const grabRatio = militaryUtil.getGrabRatio(attackerPoints, defenderPoints, 0);
	const gains = success
		? militaryUtil.getGains(defender.status, defenderMilitary.sci || 0, grabRatio)
		: undefined;

	// register attack
	const attack: Attack = {
		attackerId,
		targetId,
		createdAt: now(),
		success,
		successNumber,
		successPercentage,
		gains,

		attackerPoints,
		attackerMilitary,
		attackerLosses,

		defenderPoints,
		defenderMilitary,
		defenderLosses,
	};

	militaryUtil.deductLosses(defender.military, defenderLosses);
	militaryUtil.deductLosses(attacker.military, attackerLosses);

	if (success && gains) {
		militaryUtil.addGains(attacker.status, attacker.military, gains, 1);
		militaryUtil.addGains(defender.status, defender.military, gains, -1);
	}

	// reduce attacking meter
	attacker.status.attackMeter = Math.max(
		0,
		attacker.status.attackMeter - GAME.military.attackMeterCostPerAttack
	);

	// register attack
	const attacks = app.attacks.get(attackerId)!;
	const attackId = mapUtil.nextKey(attacks); // attacker.status.probings; //new Date().getTime(); //
	attacks.set(attackId, attack);
	void db.attacks(attackerId).createOne(attackId, attack);

	// register target's news
	const targetNews = app.news.get(targetId)!;
	const newsId = mapUtil.nextKey(targetNews);

	const attackNews: AttackNews = { id: newsId, attackId, attackerId };
	targetNews.set(newsId, attackNews);
	void db.news(targetId).createOne(newsId, attackNews);

	return { attack };
};
