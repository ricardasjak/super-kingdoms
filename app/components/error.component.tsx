import { isRouteErrorResponse, useNavigate, useRouteError } from '@remix-run/react';

export const ErrorComponent: React.FC = () => {
	const error = useRouteError();
	const navigate = useNavigate();
	let msg = 'Unknown error';
	try {
		// @ts-ignore
		msg = error.toString();
	} catch {}
	if (isRouteErrorResponse(error)) {
		msg = error.data;
	}
	return (
		<div className='my-4'>
			<h1 className={'text-lg text-error font-bold'}>Unable to complete your request</h1>
			<div className={'my-4'}>
				<span className={'text-error'}>{msg}</span>
			</div>
			<button onClick={() => navigate(-1)} className={'btn btn-error btn-outline btn-sm'}>
				Close the error
			</button>
		</div>
	);
};
