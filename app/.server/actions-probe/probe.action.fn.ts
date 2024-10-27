import { makeSOKReport } from '~/.server/actions-probe/probe.sok-report';
import {
	KingdomFull,
	PROBE_MISSIONS,
	type ProbeReport,
	type ProbesNews,
	type Probing,
} from '~/app.model';
import { appState } from '~/app.service';
import { db } from '~/.server/db';
import { mapUtil, now, probesUtil, randomNumber } from '~/utils';

export const probeActionFn = async (
	probes: number,
	missionStr: string,
	attacker: KingdomFull,
	target: KingdomFull,
	attackerId: number,
	targetId: number
) => {
	const mission = PROBE_MISSIONS.find(m => missionStr.toUpperCase() === m);
	if (!mission) {
		throw new Error('Please, select supported probes mission');
	}

	probes = Math.min(probes, attacker.status.probes);
	if (probes < 0) {
		throw new Error('You cannot send negative probes number');
	}

	if (!attacker.status.attempts) {
		throw new Error("You don't have available probe attempts left");
	}

	const failRateRandom = randomNumber();
	const successRate = probesUtil.getSuccessRate(
		probes,
		target.status.probes,
		target.status.land,
		100
	);
	const success = successRate >= failRateRandom;
	const loss = probesUtil.getProbesLoss(probes, success, randomNumber());
	console.log({ probes, mission, loss });

	let report: ProbeReport;
	if (success) {
		switch (mission) {
			case 'SOK':
				report = makeSOKReport(target.kingdom, target.status, target.military);
				break;
			case 'SOM':
				report = { message: 'Successful Spy on Military' };
				break;
		}
	} else {
		report = { message: 'Failed spy mission' };
	}

	const app = await appState();
	attacker.status.attempts--;
	attacker.status.probes -= loss;

	// register attacker's probing
	const probing: Probing = {
		attackerId,
		targetId,
		//report: { message: 'Failed spy mission.' },
		report,
		probes,
		mission,
		createdAt: now(),
		probesLost: loss,
		damage: 0,
		success,
		successRate,
	};
	const attackerProbings = app.probings.get(attackerId)!;
	const probeId = mapUtil.nextKey(attackerProbings); // attacker.status.probings; //new Date().getTime(); //
	attackerProbings.set(probeId, probing);
	void db.probings(attackerId).createOne(probeId, probing);

	// register target's news
	const targetNews = app.news.get(targetId)!;
	const newsId = mapUtil.nextKey(targetNews);

	const probeNews: ProbesNews = { id: newsId, probeId, attackerId };
	targetNews.set(newsId, probeNews);
	void db.news(targetId).createOne(newsId, probeNews);

	// target.news.list.push({ probeId, seen: false });

	// testing
	// for (let i = 0; i < 100; i++) {
	// 	attacker.status.probings++;
	// 	const probeId = attacker.status.probings; //new Date().getTime(); //mapUtil.nextKey(app.probings);
	// 	app.probings.get(attackerId)!.set(probeId, probing);
	// 	//target.news.list.push({ probeId, seen: false });
	// }
	// await db.probings(attackerId).saveAll(app.probings.get(attackerId)!);
	// await db.probings.createOne(probeId, probing);
	return { probeId, probing };
};
