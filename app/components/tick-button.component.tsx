import { useFetcher } from '@remix-run/react';
import { cx } from '~/cx';
import { routesUtil } from '~/routes.util';

interface Props {
	kdid: number;
	tick: number;
	tickLimit: number;
	times?: number;
	label: string;
	className?: string;
}

export const TickButton: React.FC<Props> = ({
	kdid,
	tick,
	tickLimit,
	times = 1,
	label,
	className,
}) => {
	const fetcher = useFetcher({ key: 'next-tick' });
	if (tickLimit <= tick) {
		return null;
	}
	return (
		<fetcher.Form method='post' action={routesUtil.kd.tick(kdid)}>
			{tick <= tickLimit ? (
				<button
					type={'submit'}
					className={cx(
						'float-right',
						{
							'text-primary hover:text-secondary': fetcher.state === 'idle',
						},
						className
					)}
					disabled={fetcher.state !== 'idle'}
				>
					{label}
				</button>
			) : (
				<div className={'float-right'}>Tick {tick}</div>
			)}
			<input type='hidden' value={times} name='times'></input>
		</fetcher.Form>
	);
};
