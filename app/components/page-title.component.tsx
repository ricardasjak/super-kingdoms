import { cx } from '~/cx';

interface Props {
	title: string;
	className?: string;
}

export const PageTitle: React.FC<Props> = ({ title, className }) => {
	return <h1 className={cx('text-lg mb-4 mt-2', className)}>{title}</h1>;
};
