import { useTypedRouteLoaderData } from 'remix-typedjson';
import { type PlayerKingdom } from '~/loaders';

export const usePlayerKingdoms = () => {
	const data = useTypedRouteLoaderData<{ kingdoms: PlayerKingdom[] }>('root');
	return data?.kingdoms || [];
};
