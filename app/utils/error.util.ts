const throwUserError = (msg: string, status = 400) => {
	throw new Response(msg, { status: 400 });
};

export const errorUtil = {
	throwUserError,
};
