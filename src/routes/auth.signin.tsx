import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/signin")({
	component: SignInPage,
});

function SignInPage() {
	const { signIn } = useAuthActions();

	useEffect(() => {
		void signIn("discord");
	}, [signIn]);

	return (
		<main className="container">
			<article aria-busy="true">Redirecting to Discord...</article>
		</main>
	);
}
