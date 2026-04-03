import type { KingdomSettings, MilitaryUnits } from "./types";

export type MilitaryUpdate = {
	updatedMilitary: MilitaryUnits;
	updatedSoldiers: number; // For cases where we return sol to population
	militaryChanged: boolean;
};

/**
 * Handles military training completion and instant unit upgrades.
 */
export function handleMilitary(
	kingdom: KingdomSettings,
	military: MilitaryUnits,
): MilitaryUpdate {
	let militaryChanged = false;
	let updatedSoldiers = military.sol;

	const updatedMilitary = {
		...military,
		queue: {
			sol: [...military.queue.sol],
			tr: [...military.queue.tr],
			dr: [...military.queue.dr],
			ft: [...military.queue.ft],
			tf: [...military.queue.tf],
			lt: [...military.queue.lt],
			ld: [...military.queue.ld],
			lf: [...military.queue.lf],
			f74: [...military.queue.f74],
			t: [...military.queue.t],
			ht: [...military.queue.ht],
			sci: [...(military.queue.sci || [])],
		},
	};

	const militaryKeys = [
		"sol",
		"tr",
		"dr",
		"ft",
		"tf",
		"lt",
		"ld",
		"lf",
		"f74",
		"t",
		"ht",
		"sci",
	] as const;

	const anyCompleting = militaryKeys.some(
		(key) => (updatedMilitary.queue[key]?.[0] ?? 0) > 0,
	);

	// 1. Training Completion
	if (anyCompleting) {
		for (const key of militaryKeys) {
			const completed = updatedMilitary.queue[key]?.[0] || 0;
			updatedMilitary[key] += completed;
			updatedMilitary.queue[key] = updatedMilitary.queue[key].slice(1);
		}
		militaryChanged = true;
		updatedSoldiers = updatedMilitary.sol;
	}

	// 2. Instant Upgrades
	if (military.target) {
		const target = { ...military.target };
		let targetChanged = false;

		const r_ld = (kingdom.research.r_ld?.perc ?? 0) >= 100;
		const r_lf = (kingdom.research.r_lf?.perc ?? 0) >= 100;
		const r_dr = (kingdom.research.r_dr?.perc ?? 0) >= 100;
		const r_ft = (kingdom.research.r_ft?.perc ?? 0) >= 100;
		const r_ht = (kingdom.research.r_ht?.perc ?? 0) >= 100;

		// Promotion sequences
		if (r_ld && (target.lt || 0) > 0) {
			target.ld = (target.ld || 0) + target.lt;
			target.lt = 0;
			targetChanged = true;
		}
		if (r_lf && (target.ld || 0) > 0) {
			target.lf = (target.lf || 0) + target.ld;
			target.ld = 0;
			targetChanged = true;
		}

		if (r_dr && (target.tr || 0) > 0) {
			target.dr = (target.dr || 0) + target.tr;
			target.tr = 0;
			targetChanged = true;
		}
		if (r_ft && (target.dr || 0) > 0) {
			target.ft = (target.ft || 0) + target.dr;
			target.dr = 0;
			targetChanged = true;
		}

		if (r_ht && (target.t || 0) > 0) {
			target.ht = (target.ht || 0) + target.t;
			target.t = 0;
			targetChanged = true;
		}

		if (targetChanged) {
			updatedMilitary.target = target;
			militaryChanged = true;
		}
	}

	// Promotion of defensive units
	if ((kingdom.research.r_ld?.perc ?? 0) >= 100 && updatedMilitary.lt > 0) {
		const pool = updatedMilitary.lt * 4;
		updatedMilitary.ld += Math.floor(pool / 5);
		updatedMilitary.sol += pool % 5;
		updatedMilitary.lt = 0;
		militaryChanged = true;
	}
	if ((kingdom.research.r_lf?.perc ?? 0) >= 100 && updatedMilitary.ld > 0) {
		const pool = updatedMilitary.ld * 5;
		updatedMilitary.lf += Math.floor(pool / 6);
		updatedMilitary.sol += pool % 6;
		updatedMilitary.ld = 0;
		militaryChanged = true;
	}

	// Promotion of offensive units
	if ((kingdom.research.r_dr?.perc ?? 0) >= 100 && updatedMilitary.tr > 0) {
		const pool = updatedMilitary.tr * 4;
		updatedMilitary.dr += Math.floor(pool / 5);
		updatedMilitary.sol += pool % 5;
		updatedMilitary.tr = 0;
		militaryChanged = true;
	}
	if ((kingdom.research.r_ft?.perc ?? 0) >= 100 && updatedMilitary.dr > 0) {
		const pool = updatedMilitary.dr * 5;
		updatedMilitary.ft += Math.floor(pool / 6);
		updatedMilitary.sol += pool % 6;
		updatedMilitary.dr = 0;
		militaryChanged = true;
	}

	// Promotion of elites
	if ((kingdom.research.r_ht?.perc ?? 0) >= 100 && updatedMilitary.t > 0) {
		const pool = updatedMilitary.t * 9;
		updatedMilitary.ht += Math.floor(pool / 12);
		updatedMilitary.sol += pool % 12;
		updatedMilitary.t = 0;
		militaryChanged = true;
	}

	updatedSoldiers = updatedMilitary.sol;

	return { updatedMilitary, updatedSoldiers, militaryChanged };
}
