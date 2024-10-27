import { Link } from '@remix-run/react';

const SignUp: React.FC = () => {
	return (
		<div className={'flex gap-4'}>
			<Link to={'/auth/sign-up'} className={'btn btn-secondary'}>
				Create New Account
			</Link>

			<Link to={'/auth/sign-in'} className={'btn btn-primary'}>
				Login to Your Account
			</Link>
		</div>
	);
};

export default SignUp;
