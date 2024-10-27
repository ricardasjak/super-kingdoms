import {
	type AppState,
	type Budget,
	type Buildings,
	type BuildingsPlan,
	type DefenceAllocation,
	type KingdomFull,
	type KingdomStatus,
	type Military,
	type MilitaryPlan,
} from '~/app.model';
import { GAME } from '~/game.const';
import { type Kingdom } from '~/kingdom/kingdom.model';
import { type WorldKingdom } from '~/loaders';
import { mapUtil, padZero } from '~/utils';

const getNetworth = (kd: KingdomStatus, buildings: Buildings, military: Military) => {
	const nwItems = [
		kd.pop * GAME.nw.population,
		kd.land * GAME.nw.land,
		kd.money * GAME.nw.money,
		kd.probes * GAME.nw.probes,
		builtLand(buildings) * GAME.nw.building,
		(Object.keys(military) as Array<keyof Military>).reduce(
			(nw, unit) => nw + GAME.nw.military[unit] * (military[unit] || 0),
			0
		),
	];
	return nwItems.map(Math.floor).reduce((result, item) => result + (item || 0), 0);
};

const builtLand = (buildings: BuildingsPlan) => {
	return (Object.keys(buildings) as Array<keyof BuildingsPlan>).reduce(
		(result, key) => result + buildings[key] || 0,
		0
	);
};

const getKingdomDefaults = () => {
	const budget: Budget = {
		military: 40,
		// research: 20,
		exploration: 25,
		construction: 35,
	};

	const buildings: Buildings = {
		residences: 80,
		powerPlants: 32,
		starMines: 32,
		barracks: 10,
		trainingCamps: 0,
		probeFactories: 0,
	};

	const buildingsPlan: BuildingsPlan = {
		residences: 30,
		powerPlants: 10,
		starMines: 15,
		barracks: 15,
		trainingCamps: 10,
		probeFactories: 20,
	};

	const military: Military = {
		sold: 200,
		sci: 10,
		tr: 0,
		lt: 0,
		t: 0,
		ld: undefined,
		dr: undefined,
	};

	const militaryPlan: MilitaryPlan = {
		sold: 20,
		sci: 30,
		tr: 0,
		lt: 0,
		t: 50,
		ld: undefined,
		dr: undefined,
	};

	const defence: DefenceAllocation = { e: 25, n: 25, s: 25, w: 25 };

	const kingdomStatus: KingdomStatus = {
		tick: 1,
		pop: 2250,
		land: 250,
		nw: 0,
		probes: 1000,
		attempts: 0,
		money: 225_000,
		power: 1_000,
		income: 0,
		powerChange: 0,
		lastNewsId: -1,
		attackMeter: 0,
	};
	kingdomStatus.nw = kdUtil.getNetworth(kingdomStatus, buildings, military);

	return {
		budget,
		buildings,
		buildingsPlan,
		defence,
		military,
		militaryPlan,
		kingdomStatus,
	};
};

const getFullKingdom = (id: number, app: AppState): KingdomFull => {
	const status = app.kingdomsStatus.get(id)!;
	return {
		kingdom: app.kingdoms.get(id)!,
		status,
		buildings: app.buildings.get(id)!,
		buildingsPlan: app.buildingsPlan.get(id)!,
		defence: app.defence.get(id)!,
		military: app.military.get(id)!,
		militaryPlan: app.militaryPlan.get(id)!,
		budget: app.budgets.get(id)!,
		news: mapUtil.toValues(app.news.get(id)!).reverse(),
	};
};

const getPowerConsumption = (kd: KingdomFull): number => {
	const military = (Object.keys(kd.military) as Array<keyof Omit<Military, 'id'>>).reduce(
		(r, unit) => {
			return r + GAME.power.military[unit] * (kd.military[unit] || 0);
		},
		0
	);

	const pop = kd.status.pop * GAME.power.misc.pop;
	const land = kd.status.land * GAME.power.misc.land;
	const building = kdUtil.builtLand(kd.buildings) * GAME.power.misc.building;

	return Math.ceil(military + pop + land + building);
};

const getWorldKingdom = (kdid: number, app: AppState): WorldKingdom => {
	const {
		kingdom: { name, x, y, planet, race },
		status: { land, nw },
	} = getFullKingdom(kdid, app);

	return {
		id: kdid,
		name,
		x,
		y,
		planet,
		race,
		land,
		nw,
	};
};

const getKingdomNameXY = ({ name, x, y }: Kingdom) => `${name} (${padZero(y)}:${padZero(x)})`;

const getMilitarySpace = (military: Military) => {
	const space = (Object.keys(military) as Array<keyof Military>).reduce((acc, unit) => {
		acc += GAME.military.space[unit] * (military[unit] || 0);
		return acc;
	}, 0);
	return Math.ceil(space);
};

const getBarracksSpace = (barracks: number) => barracks * GAME.military.barrackSpace;

const getUnsupportedMilitarySpace = (military: Military, barracks: number) => {
	const space = getMilitarySpace(military);
	const bspace = getBarracksSpace(barracks);
	return Math.max(space - bspace, 0);
};

const getBarracksCapacity = (military: Military, barracks: number) => {
	const space = getMilitarySpace(military);
	const bspace = getBarracksSpace(barracks);
	return (100 * space) / bspace;
};

export const kdUtil = {
	getKingdomNameXY,
	getNetworth,
	getKingdomDefaults,
	getMilitarySpace,
	getUnsupportedMilitarySpace,
	getBarracksSpace,
	getBarracksCapacity,
	getFullKingdom,
	getPowerConsumption,
	getWorldKingdom,
	builtLand,
};
