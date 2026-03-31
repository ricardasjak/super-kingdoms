import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
	calculateLevel,
	calculateMaxDefPotential,
	calculateMaxOffPotential,
	calculateMinDefPotential,
	calculateNetworth,
	SpyReportSOK,
	SpyReportSoE,
} from "../components/spy-report-sok";
import { GAME_PARAMS } from "../constants/game-params";

export const Route = createFileRoute("/kingdom/status")({
	component: KingdomStatusPage,
});

function KingdomStatusPage() {
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);

	if (!myKingdom) return null;

	const raxUsage =
		myKingdom.military.sol +
		myKingdom.military.tr +
		myKingdom.military.dr +
		myKingdom.military.ft +
		myKingdom.military.lt +
		myKingdom.military.ld +
		myKingdom.military.lf +
		myKingdom.military.sci +
		myKingdom.military.t * 2 +
		myKingdom.military.ht * 2;
	const raxCapacity =
		myKingdom.buildings.rax * GAME_PARAMS.buildings.raxCapacity;

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
		ht: myKingdom.military.ht,
	});
	const minDef = calculateMinDefPotential({
		lt: myKingdom.military.lt,
		ld: myKingdom.military.ld,
		lf: myKingdom.military.lf,
		f74: myKingdom.military.f74,
	});

	return (
		<main className="container">
			<article>
				<header>
					<hgroup>
						<h2>{myKingdom.kdName}</h2>
						<p>Ruled by {myKingdom.rulerName}</p>
					</hgroup>
				</header>
				<hr />
				<div className="grid">
					<SpyReportSoE
						kdName={myKingdom.kdName}
						moneyIncome={myKingdom.moneyIncome}
						powerIncome={myKingdom.powerIncome}
						power={myKingdom.power}
						probes={myKingdom.probes}
						pfCount={myKingdom.buildings.pf}
						population={myKingdom.population}
						popChange={myKingdom.popChange}
						barracksUsage={raxUsage}
						barracksCap={raxCapacity}
						research={myKingdom.research}
					/>
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
						minDefPotential={minDef}
					/>
				</div>
			</article>
		</main>
	);
}
