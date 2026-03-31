import type React from "react";

interface TooltipProps {
	content: string;
	children?: React.ReactNode;
	position?: "top" | "bottom" | "left" | "right";
	isButton?: boolean;
	showIcon?: boolean;
}

export function Tooltip({
	content,
	children,
	position = "top",
	isButton = false,
	showIcon = false,
}: TooltipProps) {
	const commonProps = {
		"data-tooltip": content,
		"data-placement": position,
		tabIndex: 0,
		style: {
			cursor: "help",
			borderBottom: "none",
			textDecoration: "none",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
		} as React.CSSProperties,
	};

	const trigger = showIcon ? "ⓘ" : children;
	const finalIsButton = isButton || showIcon;

	if (finalIsButton) {
		return (
			<button
				type="button"
				{...commonProps}
				className="outline contrast"
				style={{
					...commonProps.style,
					fontSize: "0.8rem",
					lineHeight: 1,
					padding: "0.1rem 0.3rem",
					width: "auto",
					marginBottom: 0,
					border: "none",
				}}
				onClick={(e) => {
					e.preventDefault();
				}}
			>
				{trigger}
			</button>
		);
	}

	return (
		<span {...commonProps} style={commonProps.style}>
			{trigger}
		</span>
	);
}
