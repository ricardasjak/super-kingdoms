interface ActionCardProps {
	title: string;
	description: string;
	onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, description, onClick }) => {
	return (
		<button
			onClick={onClick}
			className='btn btn-ghost border-2 border-primary hover:border-2 min-h-48 min-w-32 flex flex-col justify-center'
		>
			<h3 className='text-lg text-primary text-center'>{title}</h3>
			<p className='text-sm text-secondary text-center'>{description}</p>
		</button>
	);
};
