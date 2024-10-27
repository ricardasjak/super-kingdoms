import { redirect, type ActionFunction } from '@remix-run/node';
import { createKingdomFn } from '~/.server/actions-create-kingdom/create-kingdom.action.fn';
import { appState } from '~/app.service';
import { type CreateKingdom, type PlanetType, type RaceType } from '~/kingdom/kingdom.model';
import { authRequiredLoader } from '~/loaders';
import { routesUtil } from '~/routes.util';

export const createKingdomAction: ActionFunction = async args => {
	const body = await args.request.formData();
	const kd: CreateKingdom = {
		name: body.get('name') as string,
		planet: body.get('planet') as PlanetType,
		race: body.get('race') as RaceType,
		ruler: body.get('ruler') as string,
	};
	const round = 1;
	const session = await authRequiredLoader(args);
	const app = await appState();
	const user = app.users.get(session.userId)!;

	let lastId = 0;
	// for (let i = 1; i <= 3; i++) {
	// 	const newKingdom = await createKingdom(app, { ...kd, name: kd.name + ' ' + i }, user, round);
	// 	lastId = newKingdom.id;
	// }
	const newKingdom = await createKingdomFn(app, kd, user, round);
	lastId = newKingdom.id;

	return redirect(routesUtil.kd.home(lastId));
};
