import type { CSSProperties } from "react";

interface MaxButtonProps {
	label?: string | number;
	onClick: () => void;
	disabled?: boolean;
	style?: CSSProperties;
}

export function MaxButton({
	label = "Max",
	onClick,
	disabled,
	style,
}: MaxButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			style={{
				border: "none",
				background: "none",
				padding: "0.15rem 0.4rem",
				fontSize: "0.85rem",
				width: "auto",
				marginBottom: 0,
				color: "var(--pico-primary)",
				textDecoration: "underline",
				cursor: "pointer",
				display: "inline-block",
				boxShadow: "none",
				opacity: disabled ? 0.5 : 1,
				pointerEvents: disabled ? "none" : "auto",
				...style,
			}}
		>
			{label}
		</button>
	);
}
