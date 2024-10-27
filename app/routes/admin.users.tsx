import { type LoaderFunction } from '@remix-run/node';
import { useTypedLoaderData } from 'remix-typedjson';
import { appState } from '~/app.service';
import { authRequiredLoader } from '~/loaders';
import { mapUtil } from '~/utils/map.util';

export const loader: LoaderFunction = async args => {
	await authRequiredLoader(args);
	const app = await appState();
	return mapUtil.toValues(app.users);
};

const Page: React.FC = () => {
	const users = useTypedLoaderData<typeof loader>();
	return <pre>{JSON.stringify(users, null, 2)}</pre>;
};

export default Page;
