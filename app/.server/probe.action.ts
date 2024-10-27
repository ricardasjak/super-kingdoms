import { type ActionFunctionArgs } from '@remix-run/node';
import { probeActionFn } from '~/.server/actions-probe/probe.action.fn';
import { kdidLoaderFn, kingdomLoaderFn, targetLoaderFn } from '~/.server/kingdom.loader';

export const probeAction = async (args: ActionFunctionArgs) => {
	const attackerId = await kdidLoaderFn(args);
	const targetId = await targetLoaderFn(args);
	const attacker = await kingdomLoaderFn(attackerId);
	const target = await kingdomLoaderFn(targetId);
	const form = await args.request.formData();

	let probes = Number(form.get('probes')) || 0;
	const missionStr = (form.get('mission') || '') as string;

	return await probeActionFn(probes, missionStr, attacker, target, attackerId, targetId);
};
