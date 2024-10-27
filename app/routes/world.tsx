import { Outlet } from '@remix-run/react';
import { ErrorComponent } from '~/components';

export const ErrorBoundary = ErrorComponent;

const WorldPageLayout: React.FC = () => {
	return (
		<div className={'container mx-auto px-2 sm:px-4 pb-4'}>
			<Outlet />
		</div>
	);
};

export default WorldPageLayout;
