import { type ActionFunction, type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { db } from '~/.server/db';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { type DefenceAllocation } from '~/app.model';
import { appState } from '~/app.service';
import { DefenceComponent, PageTitle } from '~/components';
import { useKingdom } from '~/hooks/use-kingdom.hook';
import { allocationUtil } from '~/utils/allocation.util';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const { defence } = await kingdomLoaderFn(kdid);
	return typedjson({ defence });
};

export const action: ActionFunction = async args => {
	const form = await args.request.formData();
	const kdid = await kdidLoaderFn(args);
	const defence: DefenceAllocation = {
		n: Number(form.get('n')),
		e: Number(form.get('e')),
		s: Number(form.get('s')),
		w: Number(form.get('w')),
	};
	if (allocationUtil.balance(defence) < 0) {
		throw new Error(`Incorrect defence allocation ${allocationUtil.balance(defence)}%`);
	}
	const app = await appState();
	app.defence.set(kdid, defence);
	await db.defence.saveOne(kdid, defence);
	return typedjson({ success: true });
};

const KingdomDefencePage: React.FC = () => {
	const kd = useKingdom();
	const { defence } = useTypedLoaderData<typeof loader>();

	if (!kd) {
		return null;
	}

	return (
		<>
			<PageTitle title='Allocate defence' />
			<DefenceComponent kdid={kd.id} defence={defence} />
		</>
	);
};

export default KingdomDefencePage;
