import { SignUp } from '@clerk/remix';
import { routesUtil } from '~/routes.util';

export default function SignUpPage() {
	return <SignUp afterSignUpUrl={routesUtil.auth.register} />;
}
