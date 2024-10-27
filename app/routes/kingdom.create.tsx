import { Form } from '@remix-run/react';
import { createKingdomAction } from '~/.server/createKingdom.action';
import { PageTitle } from '~/components';
import { GAME } from '~/game.const';
import { usePlayerKingdoms, useSubmitting } from '~/hooks';
import { PlanetTypes, RaceTypes } from '~/kingdom';
import { authRequiredLoader } from '~/loaders';

export const action = createKingdomAction;
export const loader = authRequiredLoader;

const CreateKingdomPage = () => {
	const pending = useSubmitting();
	const kingdoms = usePlayerKingdoms();
	return (
		<div className={'content'}>
			<div className={'mb-8'}>
				<PageTitle title={kingdoms.length ? 'Expand Your Empire' : 'Start your first kingdom'} />
				<h2 className={'size text-primary mb-4 text-md'}>
					{`You can control up to ${GAME.kingdomsLimit} kingdoms`}
				</h2>
			</div>
			<Form method='post' className={'grid lg:w-1/2 lg:grid-cols-2 gap-4 mt-4'}>
				<label htmlFor='nickname'>Kingdom name</label>
				<input
					name='name'
					type='text'
					className={'input input-primary'}
					required
					minLength={3}
					maxLength={20}
				></input>

				<label htmlFor='nickname'>Ruler name</label>
				<input
					name='ruler'
					type='text'
					className={'input input-primary'}
					required
					minLength={3}
				></input>

				<label htmlFor='planet'>Planet type</label>
				<select name='planet' className={'select select-primary'} required>
					{PlanetTypes.map(pt => (
						<option value={pt} key={pt}>
							{pt}
						</option>
					))}
				</select>

				<label htmlFor='race'>Race type</label>
				<select name='race' className={'select select-primary'} required>
					{RaceTypes.map(rt => (
						<option value={rt} key={rt}>
							{rt}
						</option>
					))}
				</select>

				<label></label>
				<button type='submit' className={'btn btn-primary'} disabled={pending}>
					Create kingdom
				</button>
			</Form>
		</div>
	);
};

export default CreateKingdomPage;
