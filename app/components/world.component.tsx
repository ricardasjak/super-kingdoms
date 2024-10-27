import { cx } from '~/cx';
import { type WorldKingdom } from '~/loaders/world.loader';

interface Props {
	kingdoms: WorldKingdom[];
	ownerKingdoms: number[];
}

const SIZE = 100;

export const WorldMap: React.FC<Props> = ({ kingdoms, ownerKingdoms }) => {
	return (
		<div
			className={'hidden'}
			style={{
				maxHeight: '85vh',
				maxWidth: '100%',
				margin: '0 auto',
				aspectRatio: 1,
				display: 'grid',
				gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
				gridTemplateRows: `repeat(${SIZE}, 1fr)`,
			}}
		>
			{kingdoms.map(k => {
				const isOwner = ownerKingdoms.includes(k.id);
				return <WorldKingdomComponent key={k.id} kingdom={k} isOwner={isOwner} />;
			})}
		</div>
	);
};

const WorldKingdomComponent: React.FC<{ kingdom: WorldKingdom; isOwner: boolean }> = ({
	kingdom,
	isOwner,
}) => {
	const tooltip = [
		`${kingdom.name} (x:${kingdom.x}, y:${kingdom.y})`,
		kingdom.land.toLocaleString(),
		kingdom.nw.toLocaleString(),
	].join(' — ');

	return (
		<div
			className={cx(isOwner ? 'bg-primary' : 'bg-blue-200', 'tooltip cursor-pointer animate-pulse')}
			data-tip={tooltip}
			style={{ gridRow: `${kingdom.x}`, gridColumn: `${kingdom.y}`, borderRadius: '2px' }}
			key={kingdom.id}
		></div>
	);
};
