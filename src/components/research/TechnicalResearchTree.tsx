import type { Doc } from "../../../convex/_generated/dataModel";
import { GAME_PARAMS } from "../../constants/game-params";
import type { ResearchKey, ResearchTechType } from "../../types/game";
import { RESEARCH_TOOLTIPS } from "./ResearchTooltips";

interface TechnicalResearchTreeProps {
	myKingdom: Doc<"kingdoms">;
	handleAutoToggle: (key: string) => Promise<void>;
	showAllTech: boolean;
}

export const TECH_LABELS: Record<ResearchTechType, string> = {
	r_fusion: "Fusion Technology",
	r_core: "Energy Core",
	r_armor: "Probe Armor",
	r_long: "Longevity",
	r_dr: "Dragoons",
	r_ft: "Fighters",
	r_ld: "Laser Dragoons",
	r_lf: "Laser Fighters",
	r_f74: "Air Supremacy Beacon",
	r_tf: "Air Supremacy Beacon II",
	r_ht: "Hover Tanks",
};

export function TechnicalResearchTree({
	myKingdom,
	handleAutoToggle,
	showAllTech,
}: TechnicalResearchTreeProps) {
	const techTree = GAME_PARAMS.militaryTechTree;

	// Find all children for a given parent
	const getChildren = (parentId: string | undefined): ResearchTechType[] => {
		return (Object.keys(techTree) as ResearchTechType[]).filter(
			(key) => techTree[key].requires === parentId,
		);
	};



	const renderNode = (key: ResearchTechType, depth: number) => {
		const techInfo = techTree[key];
		const data = myKingdom.research[key];
		const prerequisite = techInfo?.requires;
		const prerequisiteMet =
			!prerequisite ||
			(myKingdom.research[prerequisite as ResearchKey]?.perc ?? 0) >= 100;
		const isCompleted = (data?.perc ?? 0) >= 100;
		const index = (myKingdom.researchAutoAssign || []).indexOf(key);
		const isAutoAssigning = index !== -1;

		if (!showAllTech && !prerequisiteMet) return null;

		const hideNode = !showAllTech && isCompleted;

		const children = getChildren(key);

		return (
			<div key={key} className="tech-list-item">
				{!hideNode && (
					<div
						className={`tech-node-content ${isCompleted ? "completed" : ""} ${!prerequisiteMet ? "locked" : ""}`}
						style={{ marginLeft: `${depth * 2}rem` }}
					>
						<div className={`tech-node-header ${isCompleted ? "completed" : ""}`}>
							<div className="tech-title-wrap">
								{depth > 0 && <span className="tech-tree-elbow">↳</span>}
								<strong style={{ fontSize: "0.85rem" }}>{TECH_LABELS[key]}</strong>
								{RESEARCH_TOOLTIPS[key]}
								{isAutoAssigning && (
									<span className="active-badge">#{index + 1} Active</span>
								)}
							</div>

							<div className="tech-node-progress-compact">
								<progress
									value={data?.perc ?? 0}
									max="100"
								/>
								<span className="progress-text">
									{data?.perc ?? 0}% ({(data?.pts ?? 0).toLocaleString()} / {techInfo.requirePoints.toLocaleString()} pts)
								</span>
							</div>

							<div className="tech-node-actions">
								{prerequisiteMet ? (
									<button
										type="button"
										className={`outline ${isAutoAssigning ? "secondary" : ""}`}
										onClick={() => handleAutoToggle(key)}
									>
										{isAutoAssigning ? "Stop" : "Start"}
									</button>
								) : (
									<span className="badge secondary">
										🔒 Locked ({TECH_LABELS[prerequisite as ResearchTechType] || prerequisite})
									</span>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Recursively render children */}
				{children.length > 0 && (
					<div className="tech-children">
						{children.map((childKey) => renderNode(childKey, hideNode ? depth : depth + 1))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="technical-research-list">
			{renderNode("r_fusion", 0)}
			{renderNode("r_long", 0)}
			{renderNode("r_ht", 0)}
		</div>
	);
}
