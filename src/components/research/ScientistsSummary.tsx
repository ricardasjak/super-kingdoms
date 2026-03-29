import { GAME_PARAMS } from "../../constants/game-params";

interface ScientistsSummaryProps {
	myKingdom: {
		researchAutoAssign?: string[];
		military: {
			sci: number;
		};
		land: number;
	};
}

export const ScientistsSummary = ({ myKingdom }: ScientistsSummaryProps) => {
	const autoAssign = myKingdom.researchAutoAssign || [];
	const sumWeights = autoAssign.reduce((sum, key) => {
		const weight =
			(
				GAME_PARAMS.research.params as Record<
					string,
					{ weight: number }
				>
			)[key]?.weight || 0;
		return sum + weight;
	}, 0);
	const scientists = myKingdom.military.sci;
	const pointsFor1PercLand =
		(myKingdom.land * 1.01) ** 2 * sumWeights -
		myKingdom.land ** 2 * sumWeights;
	const landCoverage =
		(scientists / pointsFor1PercLand) * myKingdom.land * 0.01;

	return (
		<div style={{ textAlign: "center" }}>
			<h6 style={{ marginBottom: 0 }}>
				Scientists: {scientists.toLocaleString()}
			</h6>
			<small
				style={{
					color: "var(--pico-muted-color)",
					fontSize: "0.85rem",
				}}
			>
				{sumWeights > 0 ? (
					<div>
						Covers up to{" "}
						<strong>
							{Math.floor(landCoverage).toLocaleString()}
						</strong>{" "}
						land / tick
					</div>
				) : (
					"No auto-priority topics selected"
				)}
			</small>
		</div>
	);
};
