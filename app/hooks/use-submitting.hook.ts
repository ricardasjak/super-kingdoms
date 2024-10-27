import { useNavigation } from '@remix-run/react';

export const useSubmitting = () => {
	return useNavigation().state === 'submitting';
};
