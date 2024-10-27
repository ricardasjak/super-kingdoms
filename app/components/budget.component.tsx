import { useFetcher } from '@remix-run/react';
import { useState } from 'react';
import { type Budget } from '~/app.model';
import { Allocation } from '~/components/allocation.component';
import { routesUtil } from '~/routes.util';

const BUDGET_LABELS: Record<keyof Budget, string> = {
	construction: 'Construction',
	exploration: 'Exploration',
	military: 'Military',
	// research: 'Research',
};

interface Props {
	budget: Budget;
	kdid: number;
	money: number;
	income: number;
}

export const BudgetComponent: React.FC<Props> = ({ kdid, budget, money, income }) => {
	const fetcher = useFetcher({ key: 'set-budget' });
	const [hasChanged, setHasChanged] = useState(false);
	return (
		<fetcher.Form method='POST' action={routesUtil.kd.budget(kdid)} className='max-w-2xl'>
			<input type={'hidden'} name={'kdid'} value={kdid}></input>
			<Allocation
				initial={budget}
				labels={BUDGET_LABELS}
				total={income + money}
				onDirty={setHasChanged}
			/>
			<button
				className={'btn btn-primary btn-outline btn-sm mt-4'}
				disabled={fetcher.state !== 'idle' || !hasChanged}
			>
				Confirm budget
			</button>
		</fetcher.Form>
	);
};
