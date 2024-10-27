import { getAuth } from '@clerk/remix/ssr.server';
import { type LoaderFunction, redirect } from '@remix-run/node';
import { db } from '~/.server/db';
import { type User } from '~/app.model';
import { appState } from '~/app.service';
import { routesUtil } from '~/routes.util';
import { mapUtil } from '~/utils/map.util';

export const loader: LoaderFunction = async args => {
	const session = await getAuth(args);
	if (!session?.userId) {
		throw redirect(routesUtil.auth.signin);
	}
	const app = await appState();
	const user = mapUtil.toValues(app.users).find(u => u.clerkUserId === session.userId);

	if (!user) {
		const newUser: User = {
			id: mapUtil.nextKey(app.users),
			clerkUserId: session.userId,
			email: session.sessionClaims.email as string,
		};
		app.users.set(newUser.id, newUser);
		await db.user.createOne(newUser.id, newUser);
	}
	return redirect(routesUtil.home);
};
