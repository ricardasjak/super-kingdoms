import { Link, useLocation } from '@remix-run/react';
import { TickButton } from '~/components';
import { cx } from '~/cx';
import { useKingdomContext, useKingdomId } from '~/hooks';
import { routesUtil } from '~/routes.util';

interface Props {}

const linkStyle = 'text-base-content hover:text-secondary text-sm md: text-md';
const NavLink = ({ url, title }: { url: string; title: string }) => {
	const { pathname } = useLocation();
	const isActive = pathname === url;
	return (
		<Link
			to={url}
			className={cx(linkStyle, {
				'text-primary': isActive,
			})}
			reloadDocument={false}
		>
			{title}
		</Link>
	);
};

export const KingdomNavbar: React.FC<Props> = () => {
	const kdid = useKingdomId();
	const kingdomData = useKingdomContext();

	if (!kingdomData) {
		return null;
	}

	return (
		<div className={'container mx-auto px-2 sm:px-4 py-2 visible xs:hidden'}>
			<ul
				className={
					'list flex flex-wrap xs:flex-column sm:flex-row gap-4 sm:gap-8 mb-2 text-xs sm:text-lg'
				}
			>
				{/*<li>*/}
				{/*	<NavLink url={routesUtil.kd.action(kdid)} title='Development' />*/}
				{/*</li>*/}
				<li>
					<NavLink url={routesUtil.kd.status(kdid)} title='Status' />
				</li>
				<li>
					<NavLink url={routesUtil.kd.budget(kdid)} title='Budget' />
				</li>
				<li>
					<NavLink url={routesUtil.kd.buildings(kdid)} title='Buildings' />
				</li>
				<li>
					<NavLink url={routesUtil.kd.military(kdid)} title='Military' />
				</li>
				{/*<li>*/}
				{/*	<NavLink url={routesUtil.kd.defence(kdid)} title='Defence' />*/}
				{/*</li>*/}
				<li>
					<NavLink url={routesUtil.kd.news(kdid)} title='News' />
				</li>
				<li className={'flex-grow'}>
					<div className='flex justify-end gap-2 sm:gap-4'>
						{(kingdomData?.status?.tick || 0) > 6 ? (
							<>
								<TickButton
									kdid={kdid}
									tick={kingdomData.status.tick || 1}
									tickLimit={kingdomData.ticksLimit}
									times={1}
									label={'T+1'}
								/>
								<span>
									{kingdomData.status.tick === kingdomData.ticksLimit ? 'Tick' : ''}&nbsp;
									{kingdomData.status.tick || 1}
								</span>
								<TickButton
									kdid={kdid}
									tick={kingdomData.status.tick || 1}
									tickLimit={kingdomData.ticksLimit}
									times={24}
									label={'T+24'}
								/>
							</>
						) : (
							<TickButton
								kdid={kdid}
								tick={kingdomData.status.tick || 1}
								tickLimit={kingdomData.ticksLimit}
								times={1}
								label={'Go Next T+1'}
							/>
						)}
					</div>
				</li>
			</ul>
		</div>
	);
};
