import { type KingdomFull } from '~/app.model';
import { kdUtil, PT_LABEL, RACE_LABEL } from '~/kingdom';
import { formatDiff, formatNumber } from '~/utils';

export interface KingdomStatusProps {
	kd: KingdomFull;
	kdNext: KingdomFull;
}

const StatLine: React.FC<{
	label: string;
	value?: number;
	nextValue?: number;
	formatValue?: (val?: number) => string;
}> = ({ label, value, nextValue, formatValue }) => {
	const format = formatValue || formatNumber;
	const diff = nextValue && value ? nextValue - value : undefined;
	return (
		<span>
			<span>{label}:</span>&nbsp;
			<span className='font-bold'>{format(value)}</span>
			&nbsp;
			{diff ? <span className='text-secondary text-xs'>{formatDiff(diff)}</span> : null}
		</span>
	);
};

const StatLineString: React.FC<{
	label: string;
	value: string;
}> = ({ label, value }) => {
	return (
		<span>
			<span>{label}:</span>&nbsp;
			<span className='font-bold'>{value}</span>
		</span>
	);
};

export const KingdomSoKComponent: React.FC<KingdomStatusProps> = ({ kd, kdNext }) => {
	const { kingdom, status, military } = kd;

	return (
		<div className='grid grid-cols-1'>
			<StatLineString label='Ruler' value={kingdom.ruler} />
			<StatLineString label='Planet' value={PT_LABEL[kingdom.planet]} />
			<StatLineString label='Race' value={RACE_LABEL[kingdom.race]} />
			<br />
			<StatLine label='Networth' value={status.nw} nextValue={kdNext.status.nw} />
			<StatLine label='Land' value={status.land} nextValue={kdNext.status.land} />
			<br />
			<StatLine label='Money' value={status.money} nextValue={kdNext.status.money} />
			<StatLine label='Power' value={status.power} nextValue={kdNext.status.power} />
			<StatLine label='Population' value={status.pop} nextValue={kdNext.status.pop} />
			<StatLine label='Probes' value={status.probes} nextValue={kdNext.status.probes} />
			<br />
			<StatLine label='Soldiers' value={military.sold} />
			<StatLine label='Troopers' value={military.tr} nextValue={kdNext.military.tr} />
			<StatLine label='Laser troopers' value={military.lt} nextValue={kdNext.military.lt} />
			<StatLine label='Tanks' value={military.t} nextValue={kdNext.military.t} />
			<StatLine label='Scientists' value={military.sci} nextValue={kdNext.military.sci} />
		</div>
	);
};

export const KingdomStatusComponent: React.FC<KingdomStatusProps> = ({ kd, kdNext }) => {
	const { status, buildings, military } = kd;
	const bcapacity = kdUtil.getBarracksCapacity(military, buildings.barracks).toPrecision(3) + '%';
	// const space = kdUtil.getMilitarySpace(military);
	// const bspace = kdUtil.getBarracksSpace(buildings.barracks);

	return (
		<div className='grid grid-cols-1'>
			<StatLine label='Income' value={status.income} />
			<StatLine label='Power Balance' value={status.powerChange} />
			<StatLineString label='Barracks Capacity' value={bcapacity} />
			<br />
			<StatLine
				label='Ready to Attack'
				value={status.attackMeter}
				nextValue={kdNext.status.attackMeter}
				formatValue={val => formatNumber(val || 0) + '%'}
			/>
			<StatLine
				label='Probes Attempts'
				value={status.attempts}
				nextValue={kdNext.status.attempts}
			/>
			{/*<StatLine label='Military space' value={space} />*/}
			{/*<StatLine label='Barracks space' value={bspace} />*/}
		</div>
	);
};
