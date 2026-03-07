import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/signout")({
	component: SignOutPage,
});

function SignOutPage() {
	const { signOut } = useAuthActions();
	const navigate = useNavigate();

	useEffect(() => {
		void signOut().then(() => void navigate({ to: "/" }));
	}, [signOut, navigate]);

	return (
		<main className="container">
			<article aria-busy="true">Signing you out...</article>
		</main>
	);
}
