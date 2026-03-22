import type React from "react";

interface TooltipProps {
	content: string;
	children: React.ReactNode;
	position?: "top" | "bottom" | "left" | "right";
	isButton?: boolean;
}

export function Tooltip({
	content,
	children,
	position = "top",
	isButton = false,
}: TooltipProps) {
	const commonProps = {
		"data-tooltip": content,
		...(position !== "top" ? { "data-placement": position } : {}),
		tabIndex: 0,
		style: { cursor: "help" } as React.CSSProperties,
	};

	if (isButton) {
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
					// Prevent form submission if inside a form
					// Prevent default behavior to keep focus for tooltip on touch
					e.preventDefault();
				}}
			>
				{children}
			</button>
		);
	}

	return (
		<span {...commonProps} style={commonProps.style}>
			{children}
		</span>
	);
}
