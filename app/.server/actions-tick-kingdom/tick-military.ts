import { type MilitaryPlan, type Military } from '~/app.model';
import { GAME } from '~/game.const';

type Result = {
	nextMilitary: Military;
	militaryCost: number;
};

export const tickMilitary = (
	money: number,
	pop: number,
	military: Military,
	plan: MilitaryPlan
): Result => {
	const { cost, soldiersRate } = GAME.military;
	let moneyLeft = money;
	const soldiers = military.sold || 0;
	let soldiersLeft = soldiers;

	const nextMilitary: Military = (Object.keys(plan) as Array<keyof MilitaryPlan>).reduce(
		(acc, unit) => {
			if (!unit || !plan[unit]) return acc;
			const useSoldiers = unit !== 'sold';

			let units = Math.floor((money * (plan[unit] || 0)) / 100 / cost[unit]);
			units = useSoldiers
				? Math.min(units, soldiersLeft)
				: unit === 'sold'
					? Math.min(units, soldiersRate(pop))
					: units;

			const unitsCost = units * cost[unit];

			moneyLeft -= unitsCost;
			soldiersLeft -= useSoldiers ? units : 0;
			acc[unit] = units + (acc[unit] || 0);

			return acc;
		},
		military
	);
	nextMilitary.sold! -= soldiers - soldiersLeft;

	return {
		nextMilitary,
		militaryCost: money - moneyLeft,
	};
};
