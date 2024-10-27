import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { typedjson, useTypedActionData, useTypedLoaderData } from 'remix-typedjson';
import { attackAction } from '~/.server/attack.action';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { ErrorComponent, PageTitle } from '~/components';
import { cx } from '~/cx';
import { GAME } from '~/game.const';
import { useSubmitting } from '~/hooks';
import { formatNumber, militaryUtil } from '~/utils';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const { military, status } = await kingdomLoaderFn(kdid);
	return typedjson({ military, attackMeter: status.attackMeter });
};

export const action = async (args: ActionFunctionArgs) => {
	const { attack } = await attackAction(args);
	return typedjson({ attack });
};

export const ErrorBoundary = ErrorComponent;

const AttackPage: React.FC = () => {
	const { military, attackMeter } = useTypedLoaderData<typeof loader>();
	const pending = useSubmitting();
	const response = useTypedActionData<typeof action>();
	const attack = response?.attack;
	const readyToAttack = attackMeter >= GAME.military.attackMeterCostPerAttack;

	return (
		<div>
			<PageTitle title='Attack Panel' className='text-primary' />
			<Form
				method='post'
				className={'grid grid-cols-2 gap-4 mt-4 max-w-lg'}
				style={{ gridTemplateColumns: '2fr 1fr' }}
			>
				{/*{!readyToAttack && (*/}
				{/*	<div className='col-span-2 text-primary text-center'>*/}
				{/*		Your attack meter {attackMeter}% is not high enough to make an attack. Advance some*/}
				{/*		ticks until you meter is at {GAME.military.attackMeterMax}%*/}
				{/*	</div>*/}
				{/*)}*/}

				<span className={cx('col-span-2', readyToAttack ? 'text-green-500' : 'text-red-600')}>
					Attack meter: {attackMeter}% &nbsp;
					{readyToAttack ? '(READY)' : '(NOT READY, advance some ticks)'}
				</span>

				<label htmlFor='soldiers'>Soldiers ({formatNumber(military.sold)})</label>
				<input
					name='soldiers'
					type='number'
					className={'input input-primary input-sm text-right'}
					min={0}
					max={military.sold || 0}
					value={military.sold || 0}
					readOnly
				></input>

				<label htmlFor='troopers'>Troopers ({formatNumber(military.tr)})</label>
				<input
					name='troopers'
					type='number'
					className={'input input-primary input-sm text-right'}
					min={0}
					max={military.tr || 0}
					value={military.tr || 0}
					readOnly
				></input>

				<label htmlFor='soldiers'>Tanks ({formatNumber(military.t)})</label>
				<input
					name='tanks'
					type='number'
					className={'input input-primary input-sm text-right'}
					min={0}
					max={military.t || 0}
					value={military.t || 0}
					readOnly
				></input>
				{/*<label className='col-span-2'>Choose attack direction</label>*/}
				{/*<div className='col-span-2 grid grid-cols-2 gap-4'>*/}
				{/*	<div className='form-control'>*/}
				{/*		<label className='label cursor-pointer'>*/}
				{/*			<span className='label-text'>North</span>*/}
				{/*			<input*/}
				{/*				type='radio'*/}
				{/*				name='side'*/}
				{/*				value='n'*/}
				{/*				className='radio radio-sm checked:bg-blue-500'*/}
				{/*				required*/}
				{/*			/>*/}
				{/*		</label>*/}
				{/*	</div>*/}
				{/*	<div className='form-control'>*/}
				{/*		<label className='label cursor-pointer'>*/}
				{/*			<span className='label-text'>East</span>*/}
				{/*			<input*/}
				{/*				type='radio'*/}
				{/*				name='side'*/}
				{/*				value='e'*/}
				{/*				className='radio radio-sm checked:bg-cyan-400'*/}
				{/*				required*/}
				{/*			/>*/}
				{/*		</label>*/}
				{/*	</div>*/}
				{/*	<div className='form-control'>*/}
				{/*		<label className='label cursor-pointer'>*/}
				{/*			<span className='label-text'>West</span>*/}
				{/*			<input*/}
				{/*				type='radio'*/}
				{/*				name='side'*/}
				{/*				value='w'*/}
				{/*				className='radio radio-sm checked:bg-orange-400'*/}
				{/*				required*/}
				{/*			/>*/}
				{/*		</label>*/}
				{/*	</div>*/}
				{/*	<div className='form-control'>*/}
				{/*		<label className='label cursor-pointer'>*/}
				{/*			<span className='label-text'>South</span>*/}
				{/*			<input*/}
				{/*				type='radio'*/}
				{/*				name='side'*/}
				{/*				value='s'*/}
				{/*				className='radio radio-sm checked:bg-yellow-200'*/}
				{/*				required*/}
				{/*			/>*/}
				{/*		</label>*/}
				{/*	</div>*/}
				{/*</div>*/}

				<button type='submit' className={'col-span-2 btn btn-primary btn-sm'} disabled={pending}>
					Attack!
				</button>
				<label></label>
			</Form>

			{attack && (
				<div className='mt-4'>
					<article className={cx(attack.success ? 'text-accent' : 'text-red-600')}>
						{attack.success ? 'Attack was successful. ' : 'Unfortunately, our attack has failed. '}
					</article>
					<article>
						You lost {militaryUtil.getLostUnitsNews(attack.attackerLosses).join(', ') || '0 units'}.
						Estimated success chance was {attack.successPercentage}%
					</article>
					{attack.success && attack.gains && (
						<div>
							<article>
								Your attack gains: {militaryUtil.getAttackerGainsNews(attack.gains).join(', ')}
							</article>
						</div>
					)}
					<article>
						You have killed some enemy units:{' '}
						{militaryUtil.getLostUnitsNews(attack.defenderLosses).join(', ') || '0 units'}
					</article>
				</div>
			)}
		</div>
	);
};

export default AttackPage;
