import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useKingdom } from '~/hooks/use-kingdom.hook';
import { routesUtil } from '~/routes.util';

export const loader = (args: LoaderFunctionArgs) => {
	const kdid = Number(args.params.kdid);
	return redirect(routesUtil.kd.status(kdid));
};

const KingdomPage: React.FC = () => {
	const kd = useKingdom();
	return (
		<div>
			<h1>This is kingdom page</h1>
			<pre>{JSON.stringify(kd, null, 2)}</pre>
		</div>
	);
};

export default KingdomPage;
