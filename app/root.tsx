import { ClerkApp, ClerkErrorBoundary, useAuth } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

import { type LinksFunction, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigate,
	useRouteError,
} from '@remix-run/react';
import { useEffect } from 'react';
import { useTypedLoaderData } from 'remix-typedjson';
import { type UserSession } from '~/app.model';
import { KingdomNavbar } from '~/components';
import { Navbar } from '~/components/navbar.component';
import { authLoader, type PlayerKingdom, playerKingdomsLoaderFn } from '~/loaders';
import stylesheet from '~/tailwind.css?url';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

export const meta: MetaFunction = () => [
	{
		charset: 'utf-8',
		title: 'New Remix App',
		viewport: 'width=device-width,initial-scale=1',
	},
];

// export const loader: LoaderFunction = (args) => rootAuthLoader(args);
export const loader = async (args: LoaderFunctionArgs) => {
	// const getSession = await authLoader(args);
	// @ts-ignore
	return rootAuthLoader(args, async () => {
		// const { userId, sessionClaims } = request.auth;
		const auth = await authLoader(args);
		const kingdoms = await playerKingdomsLoaderFn(auth.userId);
		return {
			...auth,
			kingdoms,
		};

		// if (userId && sessionClaims?.email) {
		// 	const session: UserSession = {
		// 		userId: 1,
		// 		clerkUserId: userId,
		// 		email: sessionClaims.email as string,
		// 	};
		// 	return Promise.resolve(session);
		// }
		// return {};
	});
};

// need this to refresh unread news count fpor any kd
export const shouldRevalidate = () => true;

function RootErrorBoundary() {
	const error = useRouteError();
	const navigate = useNavigate();
	let msg = 'Unknown error';
	try {
		// @ts-ignore
		msg = error.toString();
	} catch {}
	console.error(msg);
	return (
		<html>
			<head>
				<title>Oh no!</title>
				<Meta />
				<Links />
			</head>
			<body>
				{/* add the UI you want your users to see */}
				<h1>Some error happened</h1>
				<pre>{msg}</pre>
				<button onClick={() => navigate(-1)} className={'link link-primary'}>
					Go back
				</button>
				<Scripts />
			</body>
		</html>
	);
}

export const ErrorBoundary = ClerkErrorBoundary(RootErrorBoundary);

const App = () => {
	const rootData = useTypedLoaderData<UserSession>();
	const auth = useAuth();
	useEffect(() => {
		if (auth.userId && !rootData.clerkUserId) {
			// clerk related hack
			window.location.reload();
		}
	}, [auth.userId, rootData.clerkUserId]);

	// @ts-ignore
	const kingdoms: PlayerKingdom[] = rootData.kingdoms;
	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, values-scale=1' />
				<title>Super Kingdoms</title>
				<Meta />
				<Links />
			</head>
			<body>
				<div className='flex flex-col h-screen text-sm'>
					<header className='sticky top-0 z-10'>
						<Navbar isLoggedIn={!!rootData.userId} kingdoms={kingdoms} />
					</header>
					<main className='flex-grow border-0 border-t-2 border-t-primary'>
						<div className={'container mx-auto px-2 sm:px-4'}>
							<Outlet />
						</div>
					</main>
					<footer className='sticky bottom-0 block sm:hidden bg-accent-content border-0 border-t-2 border-t-primary'>
						<KingdomNavbar />
					</footer>
				</div>

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
};

export default ClerkApp(App);
