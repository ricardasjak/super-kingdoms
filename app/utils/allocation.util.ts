export const allocationUtil = {
	normalize: <T>(key: keyof T, value: number, values: Record<keyof T, number | undefined>) => {
		const newValues: Record<keyof T, number> = { ...values, [key]: value };
		const newBalance = Math.max(allocationUtil.balance(newValues));

		if (newBalance < 0) {
			newValues[key] = Math.max(0, newValues[key] + newBalance);
		}
		return newValues;
	},
	balance: <T>(values: Record<keyof T, number | undefined>): number => {
		return (
			100 -
			(Object.keys(values) as Array<keyof T>).reduce(
				(result, key) => result + (values[key] || 0),
				0
			)
		);
	},
	largestAloc: <T>(values: Record<keyof T, number | undefined>): number => {
		return (Object.keys(values) as Array<keyof T>).reduce(
			(result, key) => Math.max(result, values[key] || 0),
			0
		);
	},
};
