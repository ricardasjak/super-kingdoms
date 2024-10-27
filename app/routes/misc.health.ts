import { type LoaderFunction, type LoaderFunctionArgs } from '@remix-run/node';
import { db } from '~/.server/db';
import { appState } from '~/app.service';

const INTERVAL_MINUTES = 15;
const SECONDS_BELOW = 30;

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
	const minutes = new Date().getMinutes();
	const seconds = new Date().getSeconds();
	const save = new URL(args.request.url).searchParams.get('save');
	const isTimeToSave = minutes % INTERVAL_MINUTES === 0 && seconds < SECONDS_BELOW;
	const app = await appState();
	if ((isTimeToSave || save) && app.status === 'ready') {
		if (!app.kingdomsStatus.size) {
			console.error('FATAL error, missing data. Cannot save!');
			return;
		}
		console.info('*** Start save all ***', minutes, ':', seconds);
		console.time();

		const promises = [
			db.kingdomStatus.saveAll(app.kingdomsStatus),
			db.budget.saveAll(app.budgets),
			db.buildings.saveAll(app.buildings),
			db.buildingsPlan.saveAll(app.buildingsPlan),
			db.defence.saveAll(app.defence),
			// await db.kingdom.saveAll(app.kingdoms),
			db.military.saveAll(app.military),
			db.militaryPlan.saveAll(app.militaryPlan),
		];
		Promise.allSettled(promises)
			.then(() => {
				console.timeEnd();
				console.info('*** Start save all SUCCESS ***');
			})
			.catch(ex => {
				console.error('*** Failed to save all ***', ex);
				console.timeEnd();
			});
	}
	return new Response(null, {
		status: 200,
	});
};
