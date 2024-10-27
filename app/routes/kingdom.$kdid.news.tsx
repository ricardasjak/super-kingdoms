import { type ActionFunction, type LoaderFunctionArgs } from '@remix-run/node';
import { typedjson, useTypedLoaderData } from 'remix-typedjson';
import { kdidLoaderFn, kingdomLoaderFn } from '~/.server/kingdom.loader';
import { type PersonalAttackNews, type PersonalProbeNews } from '~/app.model';
import { appState } from '~/app.service';
import { NewsComponent, PageTitle } from '~/components';
import { useKingdom } from '~/hooks/use-kingdom.hook';
import { kdUtil } from '~/kingdom';

export const loader = async (args: LoaderFunctionArgs) => {
	const kdid = await kdidLoaderFn(args);
	const { news, kingdom, status } = await kingdomLoaderFn(kdid);
	const app = await appState();
	const unseenNews = news.filter(n => n.id > status.lastNewsId);
	const showAll = !!new URL(args.request.url).searchParams.get('all') || unseenNews.length === 0;
	status.lastNewsId = news[0]?.id || status.lastNewsId;

	// @ts-ignore
	const personalNews: PersonalNews[] = (showAll ? news : unseenNews)
		.map(n => {
			if ('probeId' in n) {
				const probing = app.probings.get(n.attackerId)?.get(n.probeId);
				if (!probing) {
					console.error('Probing not found: ', n.attackerId, n.probeId);
					return undefined;
				}
				const probeNews: PersonalProbeNews = {
					attackerId: probing.success ? undefined : n.attackerId,
					at: probing.createdAt,
					attackerName: probing.success
						? 'success'
						: kdUtil.getKingdomNameXY(app.kingdoms.get(probing.attackerId)!),
					// report: probing.success ? 'Somebody probed your kingdom' : 'failed probe mission',
					id: n.id,
					probing: {
						success: probing.success,
						successPercentage: probing.successRate,
						damage: probing.damage,
						probesLost: probing.probesLost,
					},
				};
				return probeNews;
			}
			if ('attackId' in n) {
				const attack = app.attacks.get(n.attackerId)?.get(n.attackId);
				if (!attack) {
					console.error('Attack not found: ', n.attackerId, n.attackId);
					return undefined;
				}

				if (attack.success && attack.gains) {
					const attackNews: PersonalAttackNews = {
						attackerId: n.attackerId,
						at: attack.createdAt,
						attackerName: kdUtil.getKingdomNameXY(app.kingdoms.get(attack.attackerId)!),
						id: n.id,
						attack: {
							success: attack.success,
							successPercentage: attack.successPercentage,
							gains: attack.gains,
							defenderLosses: attack.defenderLosses,
							attackerLosses: attack.attackerLosses,
						},
					};
					return attackNews;
				} else {
					const attackNews: PersonalAttackNews = {
						attackerId: n.attackerId,
						at: attack.createdAt,
						attackerName: kdUtil.getKingdomNameXY(app.kingdoms.get(attack.attackerId)!),
						id: n.id,
						attack: {
							success: attack.success,
							successPercentage: attack.successPercentage,
							gains: attack.gains,
							defenderLosses: attack.defenderLosses,
							attackerLosses: attack.attackerLosses,
						},
					};
					return attackNews;
				}
			}
			return undefined;
		})
		.filter(n => !!n);

	return typedjson({ personalNews, kingdom, showAll });
};

export const action: ActionFunction = async args => {
	return typedjson({ success: true });
};

const KingdomNewsPage: React.FC = () => {
	const kd = useKingdom();
	const { personalNews, kingdom, showAll } = useTypedLoaderData<typeof loader>();

	if (!kd) {
		return null;
	}

	return (
		<>
			{personalNews.length ? (
				<>
					<div className='flex flex-row items-baseline gap-2'>
						<PageTitle title={showAll ? 'All personal news of' : 'Recent news of'} />
						<span className='text-primary text-lg'>{kdUtil.getKingdomNameXY(kingdom)}</span>
					</div>
					<NewsComponent newsList={personalNews} />
					<p className='text-primary'>News count: {personalNews.length}</p>
				</>
			) : (
				<PageTitle title='No recent news' />
			)}
		</>
	);
};

export default KingdomNewsPage;
