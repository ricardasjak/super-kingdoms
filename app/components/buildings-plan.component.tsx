import { useFetcher, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { type Budget, BuildingsPlan } from '~/app.model';
import { Allocation } from '~/components/allocation.component';
import { routesUtil } from '~/routes.util';

export const BUILDING_LABELS: Record<keyof BuildingsPlan, string> = {
	residences: 'Residences',
	barracks: 'Barracks',
	powerPlants: 'Power Plants',
	starMines: 'Star Mines',
	trainingCamps: 'Training Camps',
	probeFactories: 'Probe Factories',
};

interface Props {
	plan: BuildingsPlan;
	kdid: number;
}

export const BuildingPlanComponent: React.FC<Props> = ({ kdid, plan }) => {
	const fetcher = useFetcher({ key: 'set-buildings-plan' });
	const [hasChanged, setHasChanged] = useState(false);
	return (
		<fetcher.Form method='POST' action={routesUtil.kd.buildings(kdid)}>
			<input type={'hidden'} name={'kdid'} value={kdid}></input>
			<Allocation initial={plan} labels={BUILDING_LABELS} onDirty={setHasChanged} step={1} />
			<button
				className={'btn btn-primary btn-outline btn-sm mt-4'}
				disabled={fetcher.state !== 'idle' || !hasChanged}
			>
				Confirm buildings plan
			</button>
		</fetcher.Form>
	);
};
