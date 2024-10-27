import { type ActionFunction, type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { db } from '~/.server/db';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { type Budget } from '~/app.model';
import { appState } from '~/app.service';
import { BudgetComponent, PageTitle } from '~/components';
import { useKingdom } from '~/hooks/use-kingdom.hook';
import { allocationUtil } from '~/utils/allocation.util';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const { budget, status } = await kingdomLoaderFn(kdid);
	return typedjson({ budget, status });
};

export const action: ActionFunction = async args => {
	const form = await args.request.formData();
	const kdid = await kdidLoaderFn(args);
	const budget: Budget = {
		construction: Number(form.get('construction')),
		exploration: Number(form.get('exploration')),
		military: Number(form.get('military')),
		// @ts-ignore
		research: 0, //Number(form.get('research')),
	};
	if (allocationUtil.balance(budget) < 0) {
		throw new Error(`Incorrect budget allocation ${allocationUtil.balance(budget)}%`);
	}
	const app = await appState();
	app.budgets.set(kdid, budget);
	await db.budget.saveOne(kdid, budget);
	return typedjson({ success: true });
};

const KingdomBudgetPage: React.FC = () => {
	const kd = useKingdom();
	const { budget, status } = useTypedLoaderData<typeof loader>();

	if (!kd) {
		return null;
	}

	return (
		<>
			<PageTitle title='Adjust kingdom budget' />
			<BudgetComponent kdid={kd.id} budget={budget} money={status.money} income={status.income} />
		</>
	);
};

export default KingdomBudgetPage;
