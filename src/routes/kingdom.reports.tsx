import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
	calculateLevel,
	calculateMaxDefPotential,
	calculateMaxOffPotential,
	calculateNetworth,
	SpyReportSOB,
	SpyReportSOK,
} from "../components/spy-report-sok";

export const Route = createFileRoute("/kingdom/reports")({
	component: KingdomReportsPage,
});

function KingdomReportsPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);
	const spyReports = useQuery(api.kingdoms.getSpyReports);

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/create" });
		return null;
	}

	const level = calculateLevel(myKingdom.land);
	const networth = calculateNetworth(
		myKingdom.land,
		myKingdom.buildings,
		myKingdom.military,
		myKingdom.population,
	);
	const maxDef = calculateMaxDefPotential({
		sol: myKingdom.military.sol,
		tr: myKingdom.military.tr,
		dr: myKingdom.military.dr,
		ft: myKingdom.military.ft,
		lt: myKingdom.military.lt,
		ld: myKingdom.military.ld,
		lf: myKingdom.military.lf,
		t: myKingdom.military.t,
		hgl: myKingdom.military.hgl,
		ht: myKingdom.military.ht,
	});
	const maxOff = calculateMaxOffPotential({
		tr: myKingdom.military.tr,
		dr: myKingdom.military.dr,
		ft: myKingdom.military.ft,
		tf: myKingdom.military.tf,
		lt: myKingdom.military.lt,
		ld: myKingdom.military.ld,
		lf: myKingdom.military.lf,
		f74: myKingdom.military.f74,
		t: myKingdom.military.t,
		hgl: myKingdom.military.hgl,
		ht: myKingdom.military.ht,
	});

	return (
		<main className="container">
			<article>
				<header>
					<h3>Your SOK</h3>
				</header>
				<SpyReportSOK
					kdName={myKingdom.kdName}
					rulerName={myKingdom.rulerName}
					planetType={myKingdom.planetType}
					raceType={myKingdom.raceType}
					level={level}
					land={myKingdom.land}
					networth={networth}
					honor={0}
					money={myKingdom.money}
					population={myKingdom.population}
					power={myKingdom.power}
					probes={myKingdom.probes}
					scientists={myKingdom.military.sci}
					maProtection={0}
					military={myKingdom.military}
					maxDefPotential={maxDef}
					maxOffPotential={maxOff}
				/>
			</article>

			<article>
				<header>
					<h3>Your SOB</h3>
				</header>
				<SpyReportSOB
					kdName={myKingdom.kdName}
					land={myKingdom.land}
					buildings={myKingdom.buildings}
					landQueue={myKingdom.landQueue}
				/>
			</article>

			{spyReports && spyReports.length > 0 && (
				<article>
					<header>
						<h3>Spy Reports</h3>
					</header>
					{spyReports
						.filter((report) => report.targetKdName !== myKingdom.kdName)
						.map((report) => (
							<SpyReportSOK
								key={report._id}
								kdName={report.targetKdName}
								rulerName={report.targetRulerName}
								planetType={report.targetPlanetType}
								raceType={report.targetRaceType}
								level={report.targetLevel}
								land={report.land}
								networth={report.networth}
								honor={report.honor}
								money={report.money}
								population={report.population}
								power={report.power}
								probes={report.probes}
								scientists={report.scientists}
								maProtection={report.maProtection}
								military={report.military}
								maxDefPotential={report.maxDefPotential}
								maxOffPotential={report.maxOffPotential}
								timestamp={report.spiedAt}
							/>
						))}
				</article>
			)}
		</main>
	);
}
