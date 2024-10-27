import { ActionCard } from './action-card.component';

export const ActionList: React.FC = () => {
	const handleClick = () => {
		console.log('clicked');
	};
	return (
		<div className='grid grid-cols-2 gap-2 md:gap-4 md:max-w-screen-md'>
			<ActionCard title='Military' description='Produce 150 Tanks' onClick={handleClick} />
			<ActionCard title='Education' description='Hire 1200 Scientists' onClick={handleClick} />
			<ActionCard title='Construction' description='Build 32 Star Mines' onClick={handleClick} />
			<ActionCard title='Expansion' description='Explore 48 Land' onClick={handleClick} />
		</div>
	);
};
