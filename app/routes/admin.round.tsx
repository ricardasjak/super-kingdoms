import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { db } from '~/.server/db';
import { type Round } from '~/app.model';
import { appState } from '~/app.service';
import { mapUtil } from '~/utils';

const DAY = 3600 * 24 * 1000;

export const action = async (args: ActionFunctionArgs) => {
	const app = await appState();
	const id = mapUtil.nextKey(app.rounds) || 1;
	let today = new Date().getTime();
	today = today - (today % DAY);

	const round: Round = {
		id,
		startAt: today,
		tickLength: 10, // minutes
	};
	await db.round.createOne(id, round);
	app.rounds.set(id, round);
	return typedjson({ success: true });
};

export const loader = async (args: LoaderFunctionArgs) => {
	const app = await appState();
	return typedjson({ rounds: mapUtil.toValues(app.rounds) });
};

const AdminRoundPage: React.FC = () => {
	const { rounds } = useTypedLoaderData<typeof loader>();
	return (
		<div>
			<Form method='POST'>
				<button type='submit' className='btn btn-primary'>
					Start New Round
				</button>
			</Form>
			<pre className='mt-2'>{JSON.stringify(rounds, null, 2)}</pre>
		</div>
	);
};

export default AdminRoundPage;
