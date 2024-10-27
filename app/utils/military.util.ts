import { type AttackGains, type KingdomStatus, type Military } from '~/app.model';
import { MILITARY_LABELS } from '~/components';
import { GAME } from '~/game.const';
import { singular } from '~/utils/index';

export const RESOURCES_GAIN_LABELS: Record<keyof AttackGains, string> = {
	land: 'land',
	probes: 'probes',
	power: 'power',
	pop: 'population',
	money: 'money',
	sci: 'scientists',
};

const getDefensePoints = (military: Military, isPowerless: boolean) => {
	const pts = GAME.military.defence;
	const result = (Object.keys(military) as Array<keyof Military>).reduce(
		(acc, unit) => acc + (military[unit] || 0) * pts[unit],
		0
	);
	return isPowerless ? Math.floor(result * (1 - GAME.military.powerlessPenalty)) : result;
};
const getAttackerPoints = (military: Military, isPowerless: boolean) => {
	const pts = GAME.military.offense;
	const result = (Object.keys(military) as Array<keyof Military>).reduce(
		(acc, unit) => acc + (military[unit] || 0) * pts[unit],
		0
	);
	return isPowerless ? Math.floor(result * (1 - GAME.military.powerlessPenalty)) : result;
};
const getAttackSuccessChance = (attackerPoints: number, defenderPoints: number) => {
	const ratio = attackerPoints / Math.max(defenderPoints, 1);
	return Math.min(Math.round(ratio * ratio * 100), GAME.military.successRateMax);
};

const getGrabRatio = (attackPoints: number, defenderPoints: number, ma: number) => {
	const ratio = Math.min(attackPoints / Math.max(defenderPoints, 1), 1);
	return Math.min(GAME.military.grabMaxRatio * ratio, 0.9);
};

const getAttackLossRatio = (attackPoints: number, defenderPoints: number, success: boolean) => {
	const base = Math.min(attackPoints, defenderPoints);
	const loss = base * GAME.military.attackMaxLossRatio * (success ? 0.5 : 1);
	return Math.round((100 * loss) / attackPoints) / 100;
};

const getDefenderLossRatio = (attackPoints: number, defenderPoints: number, success: boolean) => {
	const base = Math.min(attackPoints, defenderPoints);
	const loss = base * GAME.military.defenderUnitsMaxLossRatio * (success ? 0.5 : 1);
	return Math.round((100 * loss) / defenderPoints) / 100;
};

const getLostUnits = (military: Partial<Military>, ratio: number) => {
	const result = { ...military };
	(Object.keys(result) as Array<keyof Military>).forEach(unit => {
		result[unit] = Math.floor((result[unit] || 0) * ratio);
	});
	return result;
};

const getAttackerLostUnits = (military: Partial<Military>, ratio: number) => {
	return getLostUnits(military, ratio);
};

const getDefenderLostUnits = (military: Partial<Military>, ratio: number) => {
	const defensiveMilitary = (Object.keys(military) as Array<keyof Military>).reduce((acc, unit) => {
		if (GAME.military.defence[unit]) {
			acc[unit] = military[unit] || 0;
		}
		return acc;
	}, {} as Partial<Military>);
	return getLostUnits(defensiveMilitary, ratio);
};

const deductLosses = (military: Military, losses: Partial<Military>) => {
	(Object.keys(military) as Array<keyof Military>).forEach(unit => {
		if (typeof military[unit] !== 'undefined') {
			military[unit] = Math.floor((military[unit] || 0) - (losses[unit] || 0));
		}
	});
};

const getNumberLabelPairs = <T>(obj: T, labels: Record<keyof T, string>) => {
	// @ts-ignore
	const pairs = (Object.keys(obj) as Array<keyof T>).reduce((acc, prop) => {
		const qty = (obj[prop] as number) || 0;
		if (qty) {
			acc.push(`${singular(qty, labels[prop].toLowerCase())}`);
		}
		return acc;
	}, [] as string[]);
	//const [...items, lastItem] = unitsLost;
	return pairs;
};

const getLostUnitsNews = (military: Partial<Military>) => {
	return getNumberLabelPairs(military, MILITARY_LABELS);
};

const getAttackerGainsNews = (gains: AttackGains) => {
	return getNumberLabelPairs(gains, RESOURCES_GAIN_LABELS);
};

const getGains = (defender: KingdomStatus, scientists: number, ratio: number): AttackGains => {
	console.log('gains ratio', ratio);
	return {
		land: Math.floor(defender.land * ratio),
		pop: Math.floor(defender.pop * ratio),
		money: Math.floor(defender.money * ratio),
		power: Math.floor(defender.power * ratio),
		sci: Math.floor((scientists * ratio) / 2),
		probes: Math.floor((defender.probes * ratio) / 3),
	};
};

const addGains = (
	status: KingdomStatus,
	military: Military,
	gains: AttackGains,
	add: 1 | -1 = 1
) => {
	status.land += gains.land * add;
	status.money += gains.money * add;
	status.power += gains.power * add;
	status.pop += gains.pop * add;
	status.probes += gains.probes * add;

	military.sci = (military.sci || 0) + gains.sci * add;
};

export const militaryUtil = {
	getGrabRatio,
	getAttackSuccessChance,

	getAttackerPoints,
	getAttackLossRatio,
	getAttackerLostUnits,
	getAttackerGainsNews,

	getDefensePoints,
	getDefenderLossRatio,
	getDefenderLostUnits,

	getLostUnitsNews,
	deductLosses,

	getGains,
	addGains,
};
