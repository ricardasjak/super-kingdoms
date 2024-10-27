import { useFetcher } from '@remix-run/react';
import { useState } from 'react';
import { type MilitaryPlan } from '~/app.model';
import { Allocation } from '~/components/allocation.component';
import { routesUtil } from '~/routes.util';

export const MILITARY_LABELS: Record<keyof MilitaryPlan, string> = {
	sold: 'Soldiers',
	dr: 'Dragoons',
	ld: 'Laser Dragoons',
	tr: 'Troopers',
	lt: 'Laser Troopers',
	t: 'Tanks',
	sci: 'Scientists',
};

export const MILITARY_LABELS_MINI: Record<string, string> = {
	sold: 'Soldiers',
	tr: 'Troopers',
	lt: 'Laser Troopers',
	t: 'Tanks',
	sci: 'Scientists',
};

interface Props {
	plan: MilitaryPlan;
	kdid: number;
}

export const MilitaryPlanComponent: React.FC<Props> = ({ kdid, plan }) => {
	const fetcher = useFetcher({ key: 'set-military-plan' });
	const [hasChanged, setHasChanged] = useState(false);
	return (
		<fetcher.Form method='POST' action={routesUtil.kd.military(kdid)}>
			<input type={'hidden'} name={'kdid'} value={kdid}></input>
			<Allocation initial={plan} labels={MILITARY_LABELS_MINI} onDirty={setHasChanged} />
			<button
				className={'btn btn-primary btn-outline btn-sm mt-4'}
				disabled={fetcher.state !== 'idle' || !hasChanged}
			>
				Confirm military plan
			</button>
		</fetcher.Form>
	);
};
