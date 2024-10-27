import { useEffect, useState } from 'react';
import { cx } from '~/cx';
import { objectUtil } from '~/utils';
import { allocationUtil } from '~/utils/allocation.util';

export interface AllocationProps<T> {
	initial: Record<keyof T, number | undefined>;
	labels: Partial<Record<keyof T, string>>;
	total?: number;
	readOnly?: boolean;
	maxValue?: number;
	step?: number;
	onDirty?: (hasChanges: boolean) => void;
}

export function Allocation<T>({
	initial,
	labels,
	total = 0,
	maxValue,
	step = 5,
	readOnly,
	onDirty,
}: AllocationProps<T>) {
	const [values, setValues] = useState(initial);
	const allocations = values ? (Object.keys(labels) as Array<keyof T>) : [];
	const balance = 100 - allocationUtil.balance(values);
	const largestVal = allocationUtil.largestAloc(values);
	const maxValueFlex = maxValue || largestVal + (100 - balance);

	useEffect(() => {
		setValues(initial);
	}, [initial]);

	useEffect(() => {
		if (onDirty) {
			onDirty(!objectUtil.isEqual(values, initial));
		}
	}, [initial, onDirty, values]);

	const handleChange = (key: keyof T) => (e: React.FormEvent<HTMLInputElement>) => {
		const value = Number(e.currentTarget.value);
		setValues(allocationUtil.normalize(key, value, values));
	};

	return (
		<div>
			<ul className={'list'}>
				{allocations.map((aloc, index) => {
					const rate = values[aloc] || 0;
					const part = Math.floor((total * rate) / 100.0);
					return (
						<li key={index}>
							<span className={'text-sm block mb-1 mt-2 ml-8'}>
								{labels[aloc]}: {part ? `${part.toLocaleString()} (${rate}%)` : `${rate}%`}
							</span>
							<div className='flex flex-row'>
								<svg
									onClick={() => setValues(prev => ({ ...prev, [aloc]: 0 }))}
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'
									strokeWidth={1.5}
									stroke='currentColor'
									className='w-6 h-6 cursor-pointer hover:text-primary'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5'
									/>
								</svg>

								<input
									type='range'
									name={aloc.toString()}
									min={0}
									max={maxValueFlex}
									step={step}
									value={rate}
									className={cx(readOnly ? 'range' : 'range range-primary', 'mx-2')}
									onChange={handleChange(aloc)}
									readOnly={readOnly}
								/>

								<svg
									onClick={() =>
										setValues(prev => allocationUtil.normalize(aloc, maxValueFlex, prev))
									}
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'
									strokeWidth={1.5}
									stroke='currentColor'
									className='w-6 h-6 cursor-pointer hover:text-primary'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5'
									/>
								</svg>
							</div>
						</li>
					);
				})}
			</ul>
			{!readOnly && (
				<h3 className={cx('mt-4', { 'text-primary animate-pulse': balance < 100 })}>
					Total allocation: {balance}%
				</h3>
			)}
		</div>
	);
}
