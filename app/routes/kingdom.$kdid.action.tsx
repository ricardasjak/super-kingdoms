import { type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { ActionList } from 'app/kingdom-action-cards';
import { kdidLoaderFn, kingdomLoaderFn, kingdomNextLoaderFn } from '~/.server/kingdom.loader';
import { appState } from '~/app.service';
import { PageTitle } from '~/components';
import { kdUtil } from '~/kingdom';
import { gameUtil } from '~/utils';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const kd = await kingdomLoaderFn(kdid);
	const ticksLimit = gameUtil(await appState()).getTicksLimit();
	const kdNext = await kingdomNextLoaderFn(kdid);
	return typedjson({ kd, kdNext, ticksLimit });
};

const KingdomDevelopmentPage: React.FC = () => {
	const { kd } = useTypedLoaderData<typeof loader>();

	return (
		<>
			<PageTitle title={kdUtil.getKingdomNameXY(kd.kingdom)} />
			<div className={'grid gap-4 grid-cols-1 mb-4'}>
				<div className='max-w-screen-md'>
					{/*<h2 className='text-lg text-primary font-bold'>{kdUtil.getKingdomNameXY(kd.kingdom)} </h2>*/}
					<h2 className='text-lg text-primary font-bold'>Pick your next action</h2>
					<span className='text-sm mb-2 text-secondary'></span>
					<ActionList />
				</div>
			</div>
		</>
	);
};

export default KingdomDevelopmentPage;
