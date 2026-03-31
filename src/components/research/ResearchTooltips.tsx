import type { ReactNode } from "react";
import { GAME_PARAMS } from "../../constants/game-params";
import { Tooltip } from "../Tooltip";

export const RESEARCH_TOOLTIPS: Record<string, ReactNode> = {
	r_dr: (
		<Tooltip
			showIcon
			content="Unlocks Dragoons: ⚔️ 5 points."
			position="right"
		/>
	),
	r_ft: (
		<Tooltip
			showIcon
			content="Unlocks Fighters: ⚔️ 6 points."
			position="right"
		/>
	),
	r_f74: (
		<Tooltip
			showIcon
			content="Unlocks Air Support Bays and F74 Drones - 🛡️ 8 points."
			position="right"
		/>
	),
	r_tf: (
		<Tooltip
			showIcon
			content="Unlocks Tactical Fighters - ⚔️ 12 points."
			position="right"
		/>
	),
	r_ld: (
		<Tooltip
			showIcon
			content="Unlocks Laser Dragoons: 🛡️ 5 points."
			position="right"
		/>
	),
	r_lf: (
		<Tooltip
			showIcon
			content="Unlocks Laser Fighters: ⚔️ 0 | 🛡️ 6 points."
			position="right"
		/>
	),
	r_ht: (
		<Tooltip
			showIcon
			content="Unlocks Hover Tanks: Versatile heavy armor for both offense and defense."
			position="right"
		/>
	),
	r_fusion: (
		<Tooltip
			showIcon
			content={`Provides ${GAME_PARAMS.militaryTechTree.r_fusion.bonus}% bonus to power plant efficiency.`}
			position="right"
		/>
	),
	r_core: (
		<Tooltip
			showIcon
			content={`Unlocks Energy Core research, providing a ${GAME_PARAMS.militaryTechTree.r_core.bonus}% bonus to power plant efficiency and unlocking Warp Drive. Required for F74 Drones.`}
			position="right"
		/>
	),
	r_armor: (
		<Tooltip
			showIcon
			content="Advanced armor plating for your military forces."
			position="right"
		/>
	),
	r_long: (
		<Tooltip
			showIcon
			content={`Residences plus ${GAME_PARAMS.militaryTechTree.r_long.bonus} population.`}
			position="right"
		/>
	),
	mil: (
		<Tooltip
			showIcon
			content="Increases overall military unit efficiency, enhancing both offensive and defensive combat values."
			position="right"
		/>
	),
	money: (
		<Tooltip
			showIcon
			content="Boosts net income from all sources, allowing for faster expansion and unit production."
			position="right"
		/>
	),
	pop: (
		<Tooltip
			showIcon
			content="Increases population growth rates and maximum population capacity within your kingdom."
			position="right"
		/>
	),
	power: (
		<Tooltip
			showIcon
			content="Optimizes power plant efficiency, increasing energy production to support more advanced military units and buildings."
			position="right"
		/>
	),
	warp: (
		<Tooltip
			showIcon
			content="Enables advanced hyperspace navigation, allowing for faster expansion and strategic movement."
			position="right"
		/>
	),
	fdc: (
		<Tooltip
			showIcon
			content="Enables Frequency Decryption, improving communication security and potentially providing insight into enemy activities."
			position="right"
		/>
	),
};
