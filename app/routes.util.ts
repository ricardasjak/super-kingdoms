export const routesUtil = {
	home: '/',
	account: '/account',
	kd: {
		create: '/kingdom/create',
		home: (id: number) => `/kingdom/${id}`,
		action: (id: number) => `/kingdom/${id}/action`,
		status: (id: number) => `/kingdom/${id}/status`,
		budget: (id: number) => `/kingdom/${id}/budget`,
		buildings: (id: number) => `/kingdom/${id}/buildings`,
		military: (id: number) => `/kingdom/${id}/military`,
		defence: (id: number) => `/kingdom/${id}/defence`,
		news: (id: number) => `/kingdom/${id}/news`,
		tick: (id: number) => `/kingdom/${id}/tick`,
	},
	world: {
		target: (target: number) => `/world/${target}`,
		attack: (target: number) => `/world/${target}/attack`,
		probe: (target: number) => `/world/${target}/probe`,
		attackWith: (target: number, kdid: number) => `/world/${target}/attack/${kdid}`,
		probeWith: (target: number, kdid: number) => `/world/${target}/probe/${kdid}`,
	},
	signup: '/sign-up',
	auth: {
		signup: '/auth/sign-up',
		signin: '/auth/sign-in',
		register: '/auth/register',
	},
};
