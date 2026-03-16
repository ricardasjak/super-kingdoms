import { GAME_PARAMS } from "../constants/game-params";

export interface MilitaryNw {
	sol: number;
	tr: number;
	dr: number;
	ft: number;
	tf: number;
	lt: number;
	ld: number;
	lf: number;
	f74: number;
	t: number;
	hgl: number;
	ht: number;
	sci: number;
}

export interface BuildingsNw {
	res: number;
	plants: number;
	rax: number;
	sm: number;
	pf: number;
	tc: number;
	asb: number;
	ach: number;
	rubble?: number;
}

export function calculateNw(args: {
	military: MilitaryNw;
	buildings: BuildingsNw;
	land: number;
	population: number;
	money: number;
	probes: number;
}): number {
	const { military, buildings, land, population, money, probes } = args;

	const totalBuildings =
		buildings.res +
		buildings.plants +
		buildings.rax +
		buildings.sm +
		buildings.pf +
		buildings.tc +
		buildings.asb +
		buildings.ach;

	const militaryNw =
		military.sol * GAME_PARAMS.nw.units.sol +
		military.tr * GAME_PARAMS.nw.units.tr +
		military.dr * GAME_PARAMS.nw.units.dr +
		military.ft * GAME_PARAMS.nw.units.ft +
		military.tf * GAME_PARAMS.nw.units.tf +
		military.lt * GAME_PARAMS.nw.units.lt +
		military.ld * GAME_PARAMS.nw.units.ld +
		military.lf * GAME_PARAMS.nw.units.lf +
		military.f74 * GAME_PARAMS.nw.units.f74 +
		military.t * GAME_PARAMS.nw.units.t +
		military.hgl * GAME_PARAMS.nw.units.hgl +
		military.ht * GAME_PARAMS.nw.units.ht +
		military.sci * GAME_PARAMS.nw.units.sci;

	const landNw = land * GAME_PARAMS.nw.land;
	const buildingsNw = totalBuildings * GAME_PARAMS.nw.buildings;
	const popNw = population * GAME_PARAMS.nw.population;
	const moneyNw = Math.floor(money / GAME_PARAMS.nw.money);
	const probesNw = Math.floor(probes / GAME_PARAMS.nw.probes);

	return militaryNw + landNw + buildingsNw + popNw + moneyNw + probesNw;
}
