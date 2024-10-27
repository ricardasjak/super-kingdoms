export const objectUtil = {
	isEqual: (a: object, b: object) => {
		return JSON.stringify(a) === JSON.stringify(b);
	},
};
