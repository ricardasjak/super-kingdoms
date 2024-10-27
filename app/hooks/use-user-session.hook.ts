import { useRouteLoaderData } from '@remix-run/react';
import { type authLoader } from '~/loaders';

export const useUserSession = () => {
	return useRouteLoaderData<typeof authLoader>('root');
};
