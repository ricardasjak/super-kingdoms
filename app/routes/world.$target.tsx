import { type LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet, useParams } from '@remix-run/react';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { appState } from '~/app.service';
import { PageTitle } from '~/components';
import { usePlayerKingdoms } from '~/hooks';
import { PT_LABEL, RACE_LABEL } from '~/kingdom';
import { kdUtil } from '~/kingdom/kd.util';
import { routesUtil } from '~/routes.util';
import { errorUtil, formatNumber, padZero } from '~/utils';

export const loader = async (args: LoaderFunctionArgs) => {
	const targetId = Number(args.params.target);
	const app = await appState();
	if (!app.kingdoms.get(targetId)) errorUtil.throwUserError('Kingdom not found', 404);
	const worldKingdom = kdUtil.getWorldKingdom(targetId, app);
	return typedjson({ target: worldKingdom });
};

const TargetPage: React.FC = () => {
	const { target } = useTypedLoaderData<typeof loader>();
	const params = useParams();
	const kingdoms = usePlayerKingdoms();
	const kdid = Number(params?.kdid);

	return (
		<div>
			<PageTitle title='Kingdom profile' className='text-primary' />
			<div className='grid grid-cols-2 max-w-xs gap-2'>
				<span>Kingdom:</span>
				<span className='font-bold text-primary'>
					{target.name}&nbsp;({padZero(target.y)}:{padZero(target.x)})
				</span>

				<span>Planet:</span>
				<span className='font-bold text-primary'>{PT_LABEL[target.planet]}</span>

				<span>Race:</span>
				<span className='font-bold text-primary'>{RACE_LABEL[target.race]}</span>

				<span>Land:</span>
				<span className='font-bold text-primary'>{formatNumber(target.land)}</span>

				<span>Networth:</span>
				<span className='font-bold text-primary'>{formatNumber(target.nw)}</span>
			</div>
			{kingdoms?.length ? (
				<>
					<div className='flex gap-4 my-8'>
						<Link
							className='btn btn-secondary btn-outline btn-sm'
							to={routesUtil.world.attackWith(target.id, kdid || kingdoms[0].id)}
						>
							Attack
						</Link>
						<Link
							className='btn btn-secondary btn-outline btn-sm'
							to={routesUtil.world.probeWith(target.id, kdid || kingdoms[0].id)}
						>
							Probe
						</Link>
					</div>
					<hr className='my-2' />
					<div>
						<Outlet />
					</div>
				</>
			) : (
				<div>
					<h3 className='text-lg mb-2 mt-8'>Wanna attack?</h3>
					<Link to={routesUtil.kd.create} className='btn btn-primary'>
						Create Your Kingdom
					</Link>
				</div>
			)}
			<Link to={routesUtil.home} className='link block mt-8'>
				Back to World map
			</Link>
		</div>
	);
};

export default TargetPage;
