import { type AppState } from '~/app.model';

export const mapUtil = {
	toValues: <K, V>(map: Map<K, V>) => (map ? Array.from(map, ([, v]) => v) : []),
	toKeys: <K, V>(map: Map<K, V>) => Array.from(map, ([k]) => k),
	nextKey: (map: Map<string | number, any>) => {
		const keys = mapUtil.toKeys(map);
		const last = keys[keys.length - 1] as string;
		return (parseInt(last, 10) || 0) + 1;
	},
	toMap: <V>(record: Record<string, V> | undefined) => {
		const map = new Map<number, V>();
		if (!record) return map;
		for (const [key, value] of Object.entries(record)) {
			map.set(parseInt(key), value);
		}
		return map;
	},
	toAppStateObject: (state: AppState) => ({
		rounds: mapUtil.toValues(state.rounds),
		users: mapUtil.toValues(state.users),
		players: mapUtil.toValues(state.players),
		kingdoms: mapUtil.toValues(state.kingdoms),
		budgets: mapUtil.toValues(state.budgets),
		buildings: mapUtil.toValues(state.buildings),
		buildingsPlan: mapUtil.toValues(state.buildingsPlan),
		defence: mapUtil.toValues(state.defence),
		status: mapUtil.toValues(state.kingdomsStatus),
		military: mapUtil.toValues(state.military),
		militaryPlan: mapUtil.toValues(state.militaryPlan),
		probings: mapUtil.toValues(state.probings),
		news: mapUtil.toValues(state.news),
		attacks: mapUtil.toValues(state.attacks),
	}),
	toClone: <T>(o: T): T => {
		const copy = JSON.parse(JSON.stringify(o));
		return copy;
	},
};
