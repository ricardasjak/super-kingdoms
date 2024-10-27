import { useParams } from '@remix-run/react';

export const useKingdomId = () => {
	const params = useParams();
	return Number(params.kdid);
};
