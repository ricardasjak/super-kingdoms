import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { typedjson, useTypedActionData, useTypedLoaderData } from 'remix-typedjson';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { probeAction } from '~/.server/probe.action';
import { PageTitle } from '~/components';
import { useSubmitting } from '~/hooks';

export const action = async (args: ActionFunctionArgs) => {
	const { probing } = await probeAction(args);
	return typedjson({ probing });
};

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const kd = await kingdomLoaderFn(kdid);
	return typedjson({ probes: kd.status.probes, attempts: kd.status.attempts });
};

const ProbePage: React.FC = () => {
	const attacker = useTypedLoaderData<typeof loader>();
	const pending = useSubmitting();
	const response = useTypedActionData<typeof action>();
	const probing = response?.probing;
	const [probes, setProbes] = useState(probing?.probes || attacker.probes);
	useEffect(() => {
		if (probing) {
			setProbes(
				probing.probes < attacker.probes ? probing.probes : probing.probes - probing.probesLost
			);
		}
	}, [attacker.probes, probing]);

	return (
		<div>
			<PageTitle title='Probes Panel' className='text-primary' />
			<Form
				method='post'
				className={'grid grid-cols-2 gap-4 mt-4 max-w-lg'}
				style={{ gridTemplateColumns: '2fr 3fr' }}
			>
				<label htmlFor='race'>Choose mission</label>
				<select name='mission' className={'select select-primary select-sm'} required>
					<option value={'SOK'}>Spy on Kingdom</option>
					{/*<option value={'SOM'}>Spy on Military</option>*/}
				</select>

				<label htmlFor='probes'>Probes to send</label>
				<input
					name='probes'
					type='number'
					className={'input input-primary input-sm text-right'}
					value={probes}
					onChange={e => setProbes(Number(e.currentTarget.value))}
					min={0}
					max={99999999}
				></input>
				<span>Attempts left: </span>
				<span className='mx-2'>{attacker.attempts}</span>
				<div className='hidden sm:block'></div>
				<button
					type='submit'
					className={'btn btn-primary btn-sm col-span-2 sm:col-span-1'}
					disabled={pending || !attacker.attempts}
				>
					Send probes
				</button>
				{!attacker.attempts && (
					<div className='text-center col-span-2'>
						<p className='text-sm text-red-600'>Out of probe attempts</p>
					</div>
				)}
			</Form>
			{probing && (
				<div className='mt-4'>
					{!probing.success && (
						<div>
							<p className='text-red-600'>
								Probe mission failed. You lost <strong>{probing.probesLost}</strong> probes.
								Estimated success rate was {probing.successRate}%
							</p>
						</div>
					)}
					{probing.success && (
						<div>
							<p className='text-accent'>
								Probe mission was successful. You lost <strong>{probing.probesLost}</strong> probes.
								Estimated success rate was {probing.successRate}%
							</p>
							<pre className=''>{JSON.stringify(probing.report, null, 4)}</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default ProbePage;
