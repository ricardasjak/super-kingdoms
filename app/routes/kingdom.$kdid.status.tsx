import { type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { kdidLoaderFn, kingdomLoaderFn, kingdomNextLoaderFn } from '~/.server/kingdom.loader';
import { appState } from '~/app.service';
import {
	BudgetComponent,
	BuildingPlanComponent,
	KingdomSoKComponent,
	KingdomStatusComponent,
	MilitaryPlanComponent,
	PageTitle,
	TickButton,
} from '~/components';
import { kdUtil } from '~/kingdom';
import { gameUtil } from '~/utils';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const kd = await kingdomLoaderFn(kdid);
	const ticksLimit = gameUtil(await appState()).getTicksLimit();
	const kdNext = await kingdomNextLoaderFn(kdid);
	return typedjson({ kd, kdNext, ticksLimit });
};

const KingdomStatusPage: React.FC = () => {
	const { kd, kdNext, ticksLimit } = useTypedLoaderData<typeof loader>();

	return (
		<>
			<PageTitle title={`Kingdom status`} />
			<div className='text-sm text-secondary mb-2 flex flex-row items-center gap-2'>
				<span>
					Tick:{' '}
					<span className='font-bold'>
						{kd.status.tick || 1}/{ticksLimit}
					</span>
				</span>
				<TickButton
					kdid={kd.kingdom.id}
					tick={kd.status.tick || 1}
					times={1}
					tickLimit={ticksLimit}
					label='Go +1 tick'
					className='btn btn-ghost btn-sm text-secondary font-bold'
				/>
				<TickButton
					kdid={kd.kingdom.id}
					tick={kd.status.tick || 1}
					tickLimit={ticksLimit}
					times={24}
					label='Go +24 ticks'
					className='btn btn-ghost btn-sm text-secondary font-bold'
				/>
			</div>
			<div
				className={'grid gap-4 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4'}
			>
				<div>
					<h2 className='text-xl text-primary font-bold'>{kdUtil.getKingdomNameXY(kd.kingdom)} </h2>
					<span className='text-sm mb-2  text-secondary'></span>
					<br />
					<KingdomStatusComponent kd={kd} kdNext={kdNext} />
					<br />
					<KingdomSoKComponent kd={kd} kdNext={kdNext} />
				</div>

				<>
					<BudgetComponent
						budget={kd.budget}
						kdid={kd.kingdom.id}
						money={kd.status.money}
						income={kd.status.income}
					/>
					<BuildingPlanComponent plan={kd.buildingsPlan} kdid={kd.kingdom.id} />
					<MilitaryPlanComponent plan={kd.militaryPlan} kdid={kd.kingdom.id} />
				</>
			</div>
		</>
	);
};

export default KingdomStatusPage;
