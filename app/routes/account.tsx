import { SignedIn, UserButton } from '@clerk/remix';
import { PageTitle } from '~/components';

export default function Account() {
	return (
		<div>
			<SignedIn>
				<PageTitle title='My Account' />
				<p>You are signed in!</p>
				<UserButton />
			</SignedIn>
		</div>
	);
}
