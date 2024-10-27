import { tickBuildings } from '~/.server/actions-tick-kingdom/tick-buildings';
import { tickExplore } from '~/.server/actions-tick-kingdom/tick-explore';
import { tickIncome } from '~/.server/actions-tick-kingdom/tick-income';
import { tickMilitary } from '~/.server/actions-tick-kingdom/tick-military';
import { tickMoney } from '~/.server/actions-tick-kingdom/tick-money';
import { tickNetworth } from '~/.server/actions-tick-kingdom/tick-networth';
import { tickPopulation } from '~/.server/actions-tick-kingdom/tick-population';
import { tickPower } from '~/.server/actions-tick-kingdom/tick-power';
import { tickPowerIncome } from '~/.server/actions-tick-kingdom/tick-power-income';
import { tickProbeAttempts, tickProbes } from '~/.server/actions-tick-kingdom/tick-probes';
import { type BuildingsPlan, type KingdomFull } from '~/app.model';
import { GAME } from '~/game.const';
import { kdUtil } from '~/kingdom';
import { mapUtil } from '~/utils';

export const tickKingdom = (kd: KingdomFull) => {
	let { status, buildings, buildingsPlan, budget, military, militaryPlan } = kd;

	status.tick = (status?.tick || 1) + 1;
	status.income = tickIncome(status.pop, buildings.starMines);
	status.money = tickMoney(status.money, status.income);

	let money = status.money;

	const { explored, exploredCost } = tickExplore(status.land, (money * budget.exploration) / 100);
	status.land += explored;

	const { constructed, constructionCost } = tickBuildings(
		status.land,
		Math.floor((money * budget.construction) / 100),
		buildings,
		buildingsPlan
	);
	(Object.keys(constructed) as Array<keyof BuildingsPlan>).forEach(key => {
		buildings[key] += constructed[key];
	});

	const { nextMilitary, militaryCost } = tickMilitary(
		Math.floor((money * budget.military) / 100),
		status.pop,
		military,
		militaryPlan
	);
	military = nextMilitary;

	status.powerChange = tickPowerIncome(kd);
	status.power = tickPower(status.power, status.powerChange, kd.buildings.powerPlants);

	status.pop = tickPopulation(
		status.pop,
		buildings.residences,
		status.land,
		kdUtil.getUnsupportedMilitarySpace(military, buildings.barracks)
	);
	status.probes = tickProbes(status.probes, buildings.probeFactories);
	status.attempts = tickProbeAttempts(status.attempts);

	money -= exploredCost;
	money -= constructionCost;
	money -= militaryCost;
	status.money = money;
	status.attackMeter = Math.min(
		status.attackMeter + GAME.military.attackMeterPerTick,
		GAME.military.attackMeterMax
	);

	status.nw = tickNetworth(kd);
	return kd;
};

export const tickNextKingdom = (kd: KingdomFull) => {
	const copy = mapUtil.toClone(kd);
	return tickKingdom(copy);
};
