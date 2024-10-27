import React from 'react';
import { useKingdom, useKingdomStatus } from '~/hooks';

export const KingdomLine: React.FC = () => {
	const kd = useKingdom();
	const kdStatus = useKingdomStatus();
	if (!kd || !kdStatus) {
		return null;
	}
	return (
		<div className={'flex flex-col'}>
			<div className={'flex flex-row text-xs gap-1'}>
				<span className={'text-primary text-sm'}>{kd.name}</span>
				<span className={'text-primary text-sm hidden sm:inline'}>{`(x:${kd.x}, y:${kd.y})`}</span>
			</div>
			<div className={'flex flex-row text-xs gap-4'}>
				<span>{kd.planet}</span>
				<span>{kd.race}</span>
				<span>{kdStatus.land.toLocaleString()}</span>
				<span>{kdStatus.nw.toLocaleString()}</span>
			</div>
		</div>
	);
};
