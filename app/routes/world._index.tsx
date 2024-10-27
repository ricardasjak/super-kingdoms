import { type rootAuthLoader } from '@clerk/remix/ssr.server';
import { Link, useRouteLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import { useTypedLoaderData } from 'remix-typedjson';
import { WorldList } from '~/components';
import { GAME } from '~/game.const';
import { usePlayerKingdoms } from '~/hooks';
import { type PlayerKingdom } from '~/loaders';
import { worldLoader } from '~/loaders/world.loader';
import { routesUtil } from '~/routes.util';

export const loader = worldLoader;

export const WorldMapPage: React.FC = () => {
	const kingdoms = usePlayerKingdoms();
	const world = useTypedLoaderData<typeof worldLoader>();
	const canCreate = kingdoms.length < GAME.kingdomsLimit;
	const ownedKingdoms = useMemo(() => kingdoms.map(k => k.id), [kingdoms]);
	return (
		<div>
			{/*<WorldMap kingdoms={world} ownerKingdoms={ownedKingdoms} />*/}
			<WorldList kingdoms={world} ownerKingdoms={ownedKingdoms} />
			{canCreate && (
				<Link to={routesUtil.kd.create} className={'btn btn-primary mx-auto text-center'}>
					Create Kingdom
				</Link>
			)}
		</div>
	);
};

export default WorldMapPage;
