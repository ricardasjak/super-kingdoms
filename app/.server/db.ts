import { Redis } from '@upstash/redis';
import {
	type Attack,
	type Budget,
	type BuildingsBuilt,
	type BuildingsPlan,
	type DefenceAllocation,
	type KingdomStatus,
	type Military,
	type MilitaryPlan,
	type News,
	type Player,
	type Probing,
	type Round,
	type User,
} from '~/app.model';
import { type Kingdom } from '~/kingdom';
import { mapUtil } from '~/utils';

const redis = Redis.fromEnv();
const KEYS = {
	rounds: 'rounds',
	users: 'users',
	players: 'players',
	kingdoms: 'kingdoms',
	kingdomsStatus: 'kingdoms-status',
	defence: 'defence',
	budgets: 'budgets',
	buildings: 'buildings',
	buildingsPlan: 'buildings-plan',
	military: 'military',
	militaryPlan: 'military-plan',
	probings: 'probe',
	news: 'news',
	attacks: 'attacks',
};

const makeRepositoryForIndividualKingdom =
	<T>(name: string) =>
	(key: number | string) =>
		makeRepository<T>(`${name}-${key}`);

const makeRepository = <T>(key: string) => ({
	loadAll: async () => {
		console.time(`redis: ${key}: load all`);
		const data = (await redis.hgetall(key)) as Record<number, T> | undefined;
		const map = mapUtil.toMap(data);
		console.timeEnd(`redis: ${key}: load all`);
		return map;
	},
	saveAll: async (map: Map<number, T>) => {
		console.time(`redis: save all of ${key}`);

		const n = await redis.hset(key, Object.fromEntries(map));
		console.timeEnd(`redis: save all of ${key}`);
		return n;
	},
	/**
	 * Update or Create new entity of <T>
	 */
	saveOne: async (id: number, entity: object) => {
		console.time(`redis: ${key}: saved id: ${id}`);
		console.info(`redis: ${key}: saving id: ${id}`);
		await redis.hset(key, { [id]: entity });
		console.timeEnd(`redis: ${key}: saved id: ${id}`);
		return 0;
	},
	createOne: async (id: number, entity: object) => {
		console.info(`redis: ${key}: creating entity ${JSON.stringify(entity)}`);
		const n = await redis.hexists(key, id.toString());
		if (n > 0) throw `${key}: entity already exists`;
		return makeRepository(key).saveOne(id, entity);
	},
});

export const db = {
	round: makeRepository<Round>(KEYS.rounds),
	user: makeRepository<User>(KEYS.users),
	player: makeRepository<Player>(KEYS.players),
	kingdom: makeRepository<Kingdom>(KEYS.kingdoms),
	kingdomStatus: makeRepository<KingdomStatus>(KEYS.kingdomsStatus),
	defence: makeRepository<DefenceAllocation>(KEYS.defence),
	budget: makeRepository<Budget>(KEYS.budgets),
	buildings: makeRepository<BuildingsBuilt>(KEYS.buildings),
	buildingsPlan: makeRepository<BuildingsPlan>(KEYS.buildingsPlan),
	military: makeRepository<Military>(KEYS.military),
	militaryPlan: makeRepository<MilitaryPlan>(KEYS.militaryPlan),
	//probings: makeRepository<Probing>(KEYS.probings),
	probings: makeRepositoryForIndividualKingdom<Probing>(KEYS.probings),
	news: makeRepositoryForIndividualKingdom<News>(KEYS.news),
	attacks: makeRepositoryForIndividualKingdom<Attack>(KEYS.attacks),
};
