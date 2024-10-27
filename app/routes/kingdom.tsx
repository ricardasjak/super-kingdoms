import { Outlet, useNavigate, useRouteError } from '@remix-run/react';

export function ErrorBoundary() {
	const error = useRouteError();
	const navigate = useNavigate();

	let msg = 'Unknown error';
	try {
		// @ts-ignore
		msg = error.toString();
	} catch {}
	console.error(msg);
	return (
		<div>
			<h1 className={'text-xl'}>Some error happened</h1>
			<div className={'my-4'}>
				<code className={'text-error'}>{msg}</code>
			</div>
			<button onClick={() => navigate(-1)} className={'link link-primary'}>
				Go back
			</button>
		</div>
	);
}

const KingdomPageLayout: React.FC = () => {
	return (
		<div className={''}>
			<Outlet />
		</div>
	);
};

export default KingdomPageLayout;
