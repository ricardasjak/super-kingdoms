import { type ActionFunction, type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { db } from '~/.server/db';
import { serverRoutesUtil } from '~/.server/serverRoutes.util';
import { appState, printStatus } from '~/app.service';
import { PlanetTypes, RaceTypes } from '~/kingdom';
import { kdUtil } from '~/kingdom/kd.util';
import { authRequiredLoader } from '~/loaders';
import { routesUtil } from '~/routes.util';
import { mapUtil } from '~/utils/map.util';

export const loader = async (args: LoaderFunctionArgs) => {
	await authRequiredLoader(args);
	return typedjson({
		summary: printStatus(),
	});
};

export const action: ActionFunction = async () => {
	const app = await appState();
	const kingdoms = mapUtil.toValues(app.kingdoms);
	kingdoms.forEach(kd => {
		const id = kd.id;
		// const { budget, buildings, buildingsPlan, military, militaryPlan, kingdomStatus } =
		// 	kdUtil.getKingdomDefaults();

		const kdFull = kdUtil.getFullKingdom(id, app);
		const { budget, buildings, buildingsPlan, military, militaryPlan, status, kingdom } = kdFull;

		// @ts-ignore
		delete budget.id;
		// @ts-ignore
		delete buildingsPlan.id;
		// @ts-ignore
		delete buildings.id;
		// @ts-ignore
		delete military.id;
		// @ts-ignore
		delete militaryPlan.id;
		// @ts-ignore
		delete status.id;

		kingdom.race = RaceTypes[Math.floor(Math.random() * RaceTypes.length)];
		kingdom.planet = PlanetTypes[Math.floor(Math.random() * PlanetTypes.length)];

		app.budgets.set(id, budget);
		app.buildings.set(id, buildings);
		app.buildingsPlan.set(id, buildingsPlan);
		app.military.set(id, military);
		app.militaryPlan.set(id, militaryPlan);
		app.kingdomsStatus.set(id, status);
	});

	await db.budget.saveAll(app.budgets);
	await db.buildings.saveAll(app.buildings);
	await db.buildingsPlan.saveAll(app.buildingsPlan);
	await db.military.saveAll(app.military);
	await db.militaryPlan.saveAll(app.militaryPlan);
	await db.kingdomStatus.saveAll(app.kingdomsStatus);

	return redirect(serverRoutesUtil.admin.migrate);
};

// set random coords
// export const action: ActionFunction = async () => {
// 	const app = await appState();
// 	const kingdoms = mapUtil.toValues(app.kingdoms);
// 	kingdoms.forEach(kd => {
// 		const { x, y } = makeCoords();
// 		kd.x = x;
// 		kd.y = y;
// 	});
//
// 	await db.kingdom.saveAll(app.kingdoms);
// 	return redirect(routesUtil.admin.migrate);
// };

const AdminMigratePage: React.FC = () => {
	const state = useTypedLoaderData<typeof loader>();
	return (
		<div>
			<Form method='POST'>
				<button type={'submit'} className={'btn btn-primary'}>
					Execute data migration
				</button>
			</Form>
			<pre>{state.summary}</pre>
			{/*<pre>{JSON.stringify(state.kingdoms, null, 2)}</pre>*/}
		</div>
	);
};

export default AdminMigratePage;
