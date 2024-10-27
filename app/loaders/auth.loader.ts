import { getAuth } from '@clerk/remix/ssr.server';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { type UserSession } from '~/app.model';
import { appState } from '~/app.service';
import { routesUtil } from '~/routes.util';
import { mapUtil } from '~/utils/map.util';

export const authLoader = async (args: LoaderFunctionArgs): Promise<UserSession> => {
	const auth = await getAuth(args);
	const app = await appState();
	const user = mapUtil.toValues(app.users).find(u => u.clerkUserId === auth?.userId);
	if (user) {
		user.lastActiveAt = new Date().toISOString();
	}
	if (auth?.userId && !user?.id) {
		throw redirect(routesUtil.auth.register);
	}
	return {
		userId: user?.id || 0, // todo: enrich Clerk session and load userId from there
		clerkUserId: auth.userId || '',
		email: auth.sessionClaims?.email as string,
	};
};

export const authRequiredLoader = async (args: LoaderFunctionArgs): Promise<UserSession> => {
	const auth = await getAuth(args);
	if (!auth.userId) {
		throw redirect(routesUtil.auth.signin);
	}
	return await authLoader(args);
};
