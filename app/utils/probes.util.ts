import { GAME } from '~/game.const';

const getSuccessRate = (
	sentProbes: number,
	defenderProbes: number,
	defenderLand: number,
	defenderAwareness: number
): number => {
	const maxDefense = defenderLand * GAME.probes.maxDefensePerLand;
	let defense = defenderLand * GAME.probes.landDefence + defenderProbes;
	defense = Math.min(defense, maxDefense) * (defenderAwareness / 100);
	let successRate = Math.min(100, Math.round((100 * sentProbes) / defense));
	successRate = Math.max(20, successRate);
	return successRate;
};

const getRandomFactor = () => Math.floor(Math.random() * 100);
const getProbesLoss = (probes: number, success: boolean, random: number) => {
	let loss = probes * (GAME.probes.lossRatio / 100) * (1 + random / 100);
	loss = success ? loss * 2 : loss;
	return Math.round(loss);
};

export const probesUtil = {
	getSuccessRate,
	getRandomFactor,
	getProbesLoss,
};
