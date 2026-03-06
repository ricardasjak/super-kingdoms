import { createRootRoute, Outlet } from "@tanstack/react-router";
import "@picocss/pico/css/pico.min.css";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<main className="container">
			<Outlet />
		</main>
	);
}
