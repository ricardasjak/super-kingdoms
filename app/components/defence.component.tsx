import { useFetcher } from '@remix-run/react';
import { useState } from 'react';
import { type DefenceAllocation } from '~/app.model';
import { Allocation } from '~/components/allocation.component';
import { routesUtil } from '~/routes.util';

const DEFENCE_LABELS: Record<keyof DefenceAllocation, string> = {
	n: 'North',
	e: 'East',
	s: 'South',
	w: 'West',
};

interface Props {
	defence: DefenceAllocation;
	kdid: number;
}

export const DefenceComponent: React.FC<Props> = ({ kdid, defence }) => {
	const fetcher = useFetcher({ key: 'set-defence' });
	const [hasChanged, setHasChanged] = useState(false);
	return (
		<fetcher.Form method='POST' action={routesUtil.kd.defence(kdid)} className='max-w-2xl'>
			<input type={'hidden'} name={'kdid'} value={kdid}></input>
			<Allocation initial={defence} labels={DEFENCE_LABELS} onDirty={setHasChanged} />
			<button
				className={'btn btn-primary btn-outline btn-sm mt-4'}
				disabled={fetcher.state !== 'idle' || !hasChanged}
			>
				Confirm defence plan
			</button>
		</fetcher.Form>
	);
};
