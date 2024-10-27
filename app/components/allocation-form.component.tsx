import { useFetcher } from '@remix-run/react';
import { Allocation, type AllocationProps } from '~/components/allocation.component';

interface Props<T> {
	action: string;
	allocationProps: AllocationProps<T>;
	kdid: string;
	submitText: string;
}

export function AllocationForm<T>({ action, kdid, submitText, allocationProps }: Props<T>) {
	const fetcher = useFetcher({ key: 'set-budget' });
	return (
		<fetcher.Form method='POST' action={action} className='max-w-2xl'>
			<input type={'hidden'} name={'kdid'} value={kdid}></input>
			<Allocation {...allocationProps} />
			<button
				className={'btn btn-primary btn-outline btn-sm mt-4'}
				disabled={fetcher.state !== 'idle'}
			>
				{submitText}
			</button>
		</fetcher.Form>
	);
}
