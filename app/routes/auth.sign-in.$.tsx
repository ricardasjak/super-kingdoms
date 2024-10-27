import { SignIn, useAuth } from '@clerk/remix';
import { Link, useNavigate } from '@remix-run/react';
import { useCallback } from 'react';
import { routesUtil } from '~/routes.util';

export default function SignInPage() {
	const { signOut } = useAuth();
	const navigate = useNavigate();

	const handSignOut = useCallback(() => {
		signOut().then(() => navigate('/'));
	}, [navigate, signOut]);

	return (
		<div className={'flex flex-col gap-4'}>
			<SignIn />
			<div className={'flex justify-center'}>
				<p>New player?</p>&nbsp;
				<Link to={routesUtil.auth.signup} className='link-primary ml-2'>
					Create account
				</Link>
				<Link onClick={handSignOut} to={routesUtil.home} className={'absolute bottom-0 mb-4'}>
					Log out
				</Link>
			</div>
		</div>
	);
}
