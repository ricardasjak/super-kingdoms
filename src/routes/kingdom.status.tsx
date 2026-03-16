import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
	calculateLevel,
	calculateMaxDefPotential,
	calculateMaxOffPotential,
	calculateMinDefPotential,
	calculateNetworth,
	SpyReportSOK,
} from "../components/spy-report-sok";
import { GAME_PARAMS } from "../constants/game-params";

export const Route = createFileRoute("/kingdom/status")({
	component: KingdomStatusPage,
});

function KingdomStatusPage() {
	const navigate = useNavigate();
	const myKingdom = useQuery(api.kingdoms.getMyKingdom);

	if (myKingdom === undefined) {
		return <p aria-busy="true">Loading kingdom data...</p>;
	}

	if (!myKingdom) {
		navigate({ to: "/create" });
		return null;
	}

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
	const raxRatio = raxCapacity > 0 ? (raxUsage / raxCapacity) * 100 : 0;
	const raxSurplus = Math.max(0, raxUsage - raxCapacity);

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
				<div className="grid">
					<div>
						<strong>Planet Type:</strong> {myKingdom.planetType}
					</div>
					<div>
						<strong>Race Type:</strong> {myKingdom.raceType}
					</div>
				</div>
				<hr />
				<figure>
					<table>
						<tbody>
							<tr>
								<td>Population</td>
								<td>
									{myKingdom.population.toLocaleString()} (
									{myKingdom.popChange > 0
										? `+${myKingdom.popChange}`
										: myKingdom.popChange}
									)
								</td>
							</tr>
							<tr>
								<td>Net Income</td>
								<td>${myKingdom.moneyIncome.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Net Power</td>
								<td>{myKingdom.powerIncome.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Max Off</td>
								<td>{maxOff.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Max Def</td>
								<td>{maxDef.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Min Def</td>
								<td>{minDef.toLocaleString()}</td>
							</tr>

							<tr>
								<td>Scientists</td>
								<td>{myKingdom.military.sci.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Soldiers</td>
								<td>{myKingdom.military.sol.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Probes</td>
								<td>{myKingdom.probes.toLocaleString()}</td>
							</tr>
							<tr>
								<td>Barracks Usage</td>
								<td>
									{raxUsage.toLocaleString()} / {raxCapacity.toLocaleString()} (
									{raxRatio.toFixed(1)}%)
									{raxSurplus > 0 && (
										<span style={{ color: "var(--pico-del-color)" }}>
											{" "}
											(
											{Math.ceil(
												raxSurplus / GAME_PARAMS.buildings.resCapacity,
											)}{" "}
											Residences used)
										</span>
									)}
								</td>
							</tr>
						</tbody>
					</table>
				</figure>
			</article>

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
		</main>
	);
}
