import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

type PlayButtonProps = {
	onExecutionTime?: (timeMs: number | null) => void;
	onError?: (msg: string) => void;
	onSuccess?: (msg: string | null) => void;
	showText?: boolean;
	className?: string;
	style?: React.CSSProperties;
};

export function PlayButton({
	onExecutionTime,
	onError,
	onSuccess,
	showText = true,
	className = "",
	style,
}: PlayButtonProps) {
	const gameStatus = useQuery(api.game.getGameStatus);
	const advanceTick = useAction(api.game.advanceTick);
	const [isLoading, setIsLoading] = useState(false);

	const handleAdvanceTick = async () => {
		if (onError) onError("");
		if (onSuccess) onSuccess(null);
		setIsLoading(true);

		try {
			const result = await advanceTick();
			console.log("Mutation Result:", result.executionTimeMs);
			if (result?.executionTimeMs && onExecutionTime) {
				onExecutionTime(result.executionTimeMs);
			}
			if (onSuccess) {
				onSuccess("Successfully advanced tick");
			}
		} catch (error) {
			console.error("Failed to advance tick", error);
			if (onError) {
				onError(
					error instanceof Error ? error.message : "Failed to advance tick",
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const isDisabled =
		!gameStatus || gameStatus.currentTick >= gameStatus.endTick || isLoading;

	return (
		<button
			type="button"
			onClick={handleAdvanceTick}
			disabled={isDisabled}
			aria-busy={isLoading}
			className={className}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: "0.5rem",
				...style,
			}}
			title="Play Next Tick"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<title>Play Next Tick</title>
				<polygon points="5 3 19 12 5 21 5 3"></polygon>
			</svg>
			{showText && "Play Next Tick"}
		</button>
	);
}
