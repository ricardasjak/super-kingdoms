import { GAME_PARAMS } from "../constants/game-params";
import type {
	ResearchKey,
	ResearchTechType,
	ResearchTopicType,
} from "../types/game";
import type { KingdomSettings, MilitaryUnits } from "./types";

export type ResearchUpdate = Pick<
	KingdomSettings,
	"research" | "researchPts" | "researchAutoAssign"
>;

/**
 * Updates research points, assigns them to priorities, and recalculates percentages.
 */
export function handleResearch(
	kingdom: KingdomSettings,
	military: MilitaryUnits,
): ResearchUpdate {
	const research = { ...kingdom.research };
	let researchPts = kingdom.researchPts + military.sci;
	let researchAutoAssign = kingdom.researchAutoAssign
		? [...kingdom.researchAutoAssign]
		: [];

	// 1. Auto-assign points
	if (researchAutoAssign.length > 0 && researchPts > 0) {
		for (const key of researchAutoAssign) {
			if (researchPts <= 0) break;

			const researchKey = key as ResearchKey;
			const currentPts = research[researchKey]?.pts ?? 0;

			let required = 0;
			const techInfo =
				GAME_PARAMS.militaryTechTree[
					researchKey as keyof typeof GAME_PARAMS.militaryTechTree
				];

			if (techInfo) {
				if (techInfo.requires) {
					const prerequisite = research[techInfo.requires];
					if (!prerequisite || (prerequisite.perc ?? 0) < 100) continue;
				}
				required = techInfo.requirePoints;
			} else {
				const prerequisiteKey = (
					GAME_PARAMS.research.params as Record<string, { requires?: string }>
				)[researchKey]?.requires;
				if (prerequisiteKey) {
					const prerequisite = (
						research as Record<string, { pts: number; perc: number }>
					)[prerequisiteKey];
					if (!prerequisite || (prerequisite.perc ?? 0) < 100) continue;
				}
				required = GAME_PARAMS.research.required(
					researchKey as keyof typeof GAME_PARAMS.research.params,
					kingdom.land,
				);
			}

			const needed = Math.max(0, required - currentPts);
			if (needed > 0) {
				const toAssign = Math.min(researchPts, needed);
				const existing = research[researchKey] || { pts: 0, perc: 0 };
				research[researchKey] = {
					...existing,
					pts: existing.pts + toAssign,
				};
				researchPts -= toAssign;
			}
		}
	}

	// 2. Recalculate standard research
	const standardKeys: ResearchTopicType[] = [
		"pop",
		"power",
		"mil",
		"money",
		"fdc",
		"warp",
	];
	for (const key of standardKeys) {
		if (!research[key]) research[key] = { pts: 0, perc: 0 };
		const resData = research[key];
		const required = GAME_PARAMS.research.required(key, kingdom.land);
		const maxBonus = GAME_PARAMS.research.params[key].bonus;
		resData.perc =
			required > 0
				? Math.min(Math.floor((maxBonus * resData.pts) / required), maxBonus)
				: 0;
	}

	// 3. Recalculate tech research
	const techKeys: ResearchTechType[] = [
		"r_dr",
		"r_ft",
		"r_tf",
		"r_ld",
		"r_lf",
		"r_f74",
		"r_ht",
		"r_fusion",
		"r_core",
		"r_armor",
		"r_long",
	];
	for (const key of techKeys) {
		const resData = research[key];
		const pts = resData?.pts ?? 0;
		const techInfo =
			GAME_PARAMS.militaryTechTree[
				key as keyof typeof GAME_PARAMS.militaryTechTree
			];
		if (!techInfo) continue;
		const perc =
			techInfo.requirePoints > 0
				? Math.min(Math.floor((pts / techInfo.requirePoints) * 100), 100)
				: 0;
		(research as Record<string, { pts: number; perc: number }>)[key] = {
			pts,
			perc,
		};
	}

	// 4. Cleanup auto-assign queue
	if (researchAutoAssign.length > 0) {
		researchAutoAssign = researchAutoAssign.filter((key) => {
			if (standardKeys.includes(key as ResearchTopicType)) return true;
			const resData = research[key as ResearchKey];
			if (!resData) return false;
			const techInfo =
				GAME_PARAMS.militaryTechTree[
					key as keyof typeof GAME_PARAMS.militaryTechTree
				];
			return techInfo ? resData.pts < techInfo.requirePoints : true;
		});
	}

	return {
		research,
		researchPts,
		researchAutoAssign,
	};
}
