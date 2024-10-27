import { Link } from '@remix-run/react';
import { cx } from '~/cx';
import { PT_LABEL, RACE_LABEL } from '~/kingdom';
import { type WorldKingdom } from '~/loaders/world.loader';
import { routesUtil } from '~/routes.util';
import { padZero } from '~/utils';

interface Props {
	kingdoms: WorldKingdom[];
	ownerKingdoms: number[];
}

export const WorldList: React.FC<Props> = ({ kingdoms, ownerKingdoms }) => {
	const sortedKingdoms = [...kingdoms].sort(
		(a, b) =>
			// ownerKingdoms.indexOf(b.id) - ownerKingdoms.indexOf(a.id) ||
			b.nw - a.nw
	);

	return (
		<ul className={'list overflow-auto max-w-5xl'}>
			<li className={'list-item mb-2 font-bold'}>
				<div className={cx('grid grid-flow-col gap-2 sm:grid-cols-6 xs:grid-cols-4')}>
					{/*<span>#</span>*/}
					<span className='col-span-2'>Kingdom</span>
					<span className={'hidden sm:block'}>Planet</span>
					<span className={'hidden sm:block'}>Race</span>
					<span>Land</span>
					<span>Networth</span>
					<span></span>
				</div>
			</li>
			<hr className='mb-2' />
			{sortedKingdoms.map((kd, rank) => {
				const isOwner = ownerKingdoms.includes(kd.id);
				return (
					<li key={kd.id} className={'list-item mb-2'}>
						<Link
							to={routesUtil.world.target(kd.id)}
							className={cx(
								isOwner ? 'text-primary' : '',
								'link link-hover grid gap-2 grid-flow-col sm:grid-cols-6 xs:grid-cols-4'
							)}
						>
							{/*<span className='shrink'>{rank + 1}</span>*/}
							<span className='col-span-2'>{`${'#' + (rank + 1)} ${kd.name} (${padZero(
								kd.y
							)}:${padZero(kd.x)})`}</span>
							<span className={'hidden sm:block'}>{PT_LABEL[kd.planet]}</span>
							<span className={'hidden sm:block'}>{RACE_LABEL[kd.race]}</span>
							<span>{kd.land.toLocaleString()}</span>
							<span>{kd.nw.toLocaleString()}</span>
							<span></span>
						</Link>
					</li>
				);
			})}
		</ul>
	);
};
