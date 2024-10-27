import { type MetaFunction } from '@remix-run/node';
import { useMemo, useState } from 'react';
import { useTypedLoaderData } from 'remix-typedjson';
import { WorldList, WorldMap } from '~/components';
import { usePlayerKingdoms } from '~/hooks';
import { worldLoader } from '~/loaders/world.loader';

export const meta: MetaFunction = () => {
	return [{ title: 'World map' }, { name: 'description', content: 'Welcome to Super Kingdoms!' }];
};

export const loader = worldLoader;

export default function Index() {
	const kingdoms = usePlayerKingdoms();
	const world = useTypedLoaderData<typeof worldLoader>();
	const [showMap, setShowMap] = useState(false);

	const ownedKingdoms = useMemo(() => kingdoms.map(k => k.id), [kingdoms]);
	return (
		<div
			style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}
			className='flex flex-col mt-4'
		>
			{/*<h1 className={'text-xl mb-2 inline-block'}>*/}
			{/*	Welcome to <span className={'text-primary'}>Super kingdoms.</span> &nbsp;*/}
			{/*</h1>*/}
			{/*{hasKingdom ? (*/}
			{/*	<>*/}
			{/*		/!*<h2 className={'text-primary text-sm mb-8'}>Check your kingdoms:</h2>*!/*/}
			{/*		/!*<ul className={'list'}>*!/*/}
			{/*		/!*	{kingdoms.map(kd => (*!/*/}
			{/*		/!*		<li key={kd.id} className={'list-item mb-2'}>*!/*/}
			{/*		/!*			<Link*!/*/}
			{/*		/!*				to={routesUtil.kd.home(kd.id)}*!/*/}
			{/*		/!*				className={'link link-hover grid grid-flow-col sm:grid-cols-5 xs:grid-cols-3'}*!/*/}
			{/*		/!*			>*!/*/}
			{/*		/!*				<span>{`${kd.name} (${kd.x}:${kd.y})`}</span>*!/*/}
			{/*		/!*				<span className={'hidden sm:block'}>{kd.planet}</span>*!/*/}
			{/*		/!*				<span className={'hidden sm:block'}>{kd.race}</span>*!/*/}
			{/*		/!*				<span>{kd.land.toLocaleString()}</span>*!/*/}
			{/*		/!*				<span>{kd.nw.toLocaleString()}</span>*!/*/}
			{/*		/!*				<span>${kd.money.toLocaleString()}</span>*!/*/}
			{/*		/!*			</Link>*!/*/}
			{/*		/!*		</li>*!/*/}
			{/*		/!*	))}*!/*/}
			{/*		/!*</ul>*!/*/}
			{/*	</>*/}
			{/*) : (*/}
			{/*	<>*/}
			{/*		<br />*/}
			{/*		<span className={'text-sm mb-8'}>It's time to start your journey!</span>*/}
			{/*		&nbsp;*/}
			{/*	</>*/}
			{/*)}*/}
			{/*<hr className={'border-primary my-4'} />*/}

			<div className='mb-0 hidden sm:block'>
				{/*<Link to={routesUtil.kd.create} className={'btn btn-primary btn-sm'}>*/}
				{/*	Create Kingdom*/}
				{/*</Link>*/}

				<label className='label cursor-pointer float-right'>
					<span className='label-text text-primary'>Toggle world view &nbsp;</span>
					<input
						type='checkbox'
						className='toggle toggle-primary'
						checked={showMap}
						onChange={() => setShowMap(prev => !prev)}
					/>
				</label>
			</div>
			<div className={''}>
				{/*<h3 className={'text-primary text-lg text-center'}>World map</h3>*/}
				{/*<WorldMap kingdoms={world} ownerKingdoms={ownedKingdoms} />*/}
				{showMap ? (
					<WorldMap kingdoms={world} ownerKingdoms={ownedKingdoms} />
				) : (
					<WorldList kingdoms={world} ownerKingdoms={ownedKingdoms} />
				)}
			</div>
		</div>
	);
}
