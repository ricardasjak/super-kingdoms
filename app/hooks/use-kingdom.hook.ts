import { useTypedRouteLoaderData } from 'remix-typedjson';
import { type kingdomLoader } from '~/.server/kingdom.loader';
import { type KingdomStatus } from '~/app.model';
import { type Kingdom } from '~/kingdom';

/**
 * Returns active kingdom on the client side (if one selected)
 */
export const useKingdom = (): Kingdom | undefined => {
	return useTypedRouteLoaderData<typeof kingdomLoader>('routes/kingdom.$kdid')?.kingdom;
};

export const useKingdomContext = () => {
	return useTypedRouteLoaderData<typeof kingdomLoader>('routes/kingdom.$kdid');
};

export const useKingdomStatus = (): KingdomStatus | undefined => {
	return useTypedRouteLoaderData<typeof kingdomLoader>('routes/kingdom.$kdid')?.status;
};
