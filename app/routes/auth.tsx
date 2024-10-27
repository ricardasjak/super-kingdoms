import { Outlet } from '@remix-run/react';

export default function () {
	return (
		<div className={'w-full p-4 mx-auto flex justify-center'}>
			<Outlet />
		</div>
	);
}
