import { Fragment } from "react";
import { GAME_PARAMS } from "../constants/game-params";
import { calculateNw } from "../utils/nwUtils";

export function calculateLevel(land: number): number {
	return Math.floor(Math.sqrt(land) / 10) + 1;
}

export function calculateNetworth(
	land: number,
	buildings: {
		res: number;
		plants: number;
		rax: number;
		sm: number;
		pf: number;
		tc: number;
		asb: number;
		ach: number;
	},
	military: {
		sol: number;
		tr: number;
		dr: number;
		ft: number;
		tf: number;
		lt: number;
		ld: number;
		lf: number;
		f74: number;
		t: number;
		hgl: number;
		ht: number;
		sci: number;
	},
	population: number,
): number {
	return calculateNw({
		military,
		buildings,
		land,
		population,
		money: 0,
		probes: 0,
	});
}

export function calculateMaxDefPotential(military: {
	sol: number;
	tr: number;
	dr: number;
	ft: number;
	lt: number;
	ld: number;
	lf: number;
	t: number;
	hgl: number;
	ht: number;
}): number {
	return GAME_PARAMS.military.calculateMaxDefPotential(military);
}

export function calculateMaxOffPotential(military: {
	tr: number;
	dr: number;
	ft: number;
	tf: number;
	lt: number;
	ld: number;
	lf: number;
	f74: number;
	t: number;
	hgl: number;
	ht: number;
}): number {
	return GAME_PARAMS.military.calculateMaxOffPotential(military);
}

export function calculateMinDefPotential(military: {
	lt: number;
	ld: number;
	lf: number;
	f74: number;
}): number {
	return GAME_PARAMS.military.calculateMinDefPotential(military);
}

function formatDate(timestamp: number) {
	const date = new Date(timestamp);
	return (
		date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}) +
		" at " +
		date.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		})
	);
}

export function SpyReportSOK({
	kdName,
	rulerName,
	planetType,
	raceType,
	level,
	land,
	networth,
	honor,
	money,
	population,
	power,
	probes,
	scientists,
	maProtection,
	military,
	maxDefPotential,
	maxOffPotential,
	minDefPotential,
	timestamp,
}: {
	kdName: string;
	rulerName: string;
	planetType: string;
	raceType: string;
	level: number;
	land: number;
	networth: number;
	honor: number;
	money: number;
	population: number;
	power: number;
	probes: number;
	scientists: number;
	maProtection: number;
	military: {
		sol: number;
		tr: number;
		dr: number;
		ft: number;
		tf: number;
		lt: number;
		ld: number;
		lf: number;
		f74: number;
		t: number;
		hgl: number;
		ht: number;
	};
	maxDefPotential: number;
	maxOffPotential: number;
	minDefPotential: number;
	timestamp?: number;
}) {
	return (
		<article style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
			<header>
				<strong>{kdName} - SOK</strong>
				{timestamp && (
					<span
						style={{ marginLeft: "0.5rem", color: "var(--pico-muted-color)" }}
					>
						{formatDate(timestamp)}
					</span>
				)}
			</header>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "180px 1fr",
					gap: "0.15rem",
				}}
			>
				<span>Ruler Name:</span>
				<span>{rulerName}</span>
				<span>Planet Type:</span>
				<span>{planetType}</span>
				<span>Race:</span>
				<span>
					{raceType} Lvl {level}
				</span>
				<span>Land:</span>
				<span>{land.toLocaleString()}</span>
				<span>Networth:</span>
				<span>{networth.toLocaleString()}</span>
				<span>Honor:</span>
				<span>{honor.toLocaleString()}</span>
				<span>Money:</span>
				<span>{money.toLocaleString()}</span>
				<span>Population:</span>
				<span>{population.toLocaleString()}</span>
				<span>Power:</span>
				<span>{power.toLocaleString()}</span>
				<span>Probes:</span>
				<span>{probes.toLocaleString()}</span>
				<span>Scientists:</span>
				<span>{scientists.toLocaleString()}</span>
				<span>MA Protection:</span>
				<span>{maProtection}%</span>
			</div>
			<hr style={{ margin: "0.4rem 0" }} />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "180px 1fr",
					gap: "0.15rem",
				}}
			>
				{[
					{ label: "Soldiers", value: military.sol },
					{ label: "Troopers", value: military.tr },
					{ label: "Dragoons", value: military.dr },
					{ label: "Fighters", value: military.ft },
					{ label: "Tactical Fighters", value: military.tf },
					{ label: "Laser Troopers", value: military.lt },
					{ label: "Laser Dragoons", value: military.ld },
					{ label: "Laser Fighters", value: military.lf },
					{ label: "F74 Interceptor Drones", value: military.f74 },
					{ label: "Tanks", value: military.t },
					{ label: "High Guard Lancers", value: military.hgl },
					{ label: "Hover Tanks", value: military.ht },
				]
					.filter((u) => u.value > 0)
					.map((u) => (
						<>
							<span>{u.label}:</span>
							<span>{u.value.toLocaleString()}</span>
						</>
					))}
			</div>
			<hr style={{ margin: "0.4rem 0" }} />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "180px 1fr",
					gap: "0.15rem",
				}}
			>
				<span>Max Def. Potential:</span>
				<span>{maxDefPotential.toLocaleString()}</span>
				<span>Min Def. Potential:</span>
				<span>{minDefPotential.toLocaleString()}</span>
				<span>Max Off. Potential:</span>
				<span>{maxOffPotential.toLocaleString()}</span>
			</div>
		</article>
	);
}

type Research = {
	pop: { pts: number; perc: number };
	power: { pts: number; perc: number };
	mil: { pts: number; perc: number };
	money: { pts: number; perc: number };
	fdc: { pts: number; perc: number };
	warp: { pts: number; perc: number };
};

export function SpyReportSoE({
	kdName,
	moneyIncome,
	powerIncome,
	pfCount,
	population,
	popChange,
	barracksUsage,
	barracksCap,
	research,
	power,
	probes,
}: {
	kdName: string;
	moneyIncome: number;
	powerIncome: number;
	power: number;
	probes: number;
	pfCount: number;
	population: number;
	popChange: number;
	barracksUsage: number;
	barracksCap: number;
	research?: Research;
}) {
	const probeProduction = pfCount * 1;
	const researchKeys = ["pop", "power", "mil", "money", "warp", "fdc"] as const;
	const researchLabels: Record<(typeof researchKeys)[number], string> = {
		pop: "Population Bonus",
		power: "Power Bonus",
		mil: "Military Bonus",
		money: "Money Bonus",
		fdc: "FDC",
		warp: "Warp Drive",
	};
	return (
		<article style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
			<header>
				<strong>{kdName} - Economy</strong>
			</header>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "180px 1fr",
					gap: "0.15rem",
				}}
			>
				<span>Net Income:</span>
				<span>${moneyIncome.toLocaleString()}</span>
				<span>Power:</span>
				<span>
					{power.toLocaleString()} (
					<span
						style={{
							color: powerIncome < 0 ? "var(--pico-del-color)" : "inherit",
						}}
					>
						{powerIncome >= 0
							? `+${powerIncome.toLocaleString()}`
							: powerIncome.toLocaleString()}
					</span>
					)
				</span>

				<span>Probes:</span>
				<span>
					{probes.toLocaleString()} (+{probeProduction.toLocaleString()})
				</span>
				<span>Population:</span>
				<span>
					{population.toLocaleString()} (
					{popChange > 0 ? `+${popChange}` : popChange})
				</span>
				<span>Barracks:</span>
				<span>
					{barracksUsage.toLocaleString()} / {barracksCap.toLocaleString()}{" "}
					{barracksCap > 0 && (
						<span
							style={{
								color:
									barracksUsage > barracksCap
										? "var(--pico-del-color)"
										: "inherit",
							}}
						>
							({((barracksUsage / barracksCap) * 100).toFixed(0)}%)
						</span>
					)}
				</span>
				{research && researchKeys.some((key) => research[key].pts > 0) && (
					<Fragment>
						<hr
							style={{
								gridColumn: "1 / -1",
								margin: "0.4rem 0",
							}}
						/>
						{researchKeys.map((key) => {
							const bonus = research[key].perc;
							if (bonus === 0) return null;
							return (
								<Fragment key={key}>
									<span>{researchLabels[key]}:</span>
									<span>+{bonus}%</span>
								</Fragment>
							);
						})}
					</Fragment>
				)}
			</div>
		</article>
	);
}

const BUILDING_NAMES: Record<string, string> = {
	res: "Residences",
	plants: "Power Plants",
	rax: "Barracks",
	sm: "Star Mines",
	pf: "Probe Factories",
	tc: "Training Camps",
	asb: "Air Support Bays",
	ach: "Aegis Control Hub",
	rubble: "Rubble",
	land: "Land",
};

export function SpyReportSOB({
	kdName,
	land,
	buildings,
	landQueue,
	timestamp,
}: {
	kdName: string;
	land: number;
	buildings: {
		res: number;
		plants: number;
		rax: number;
		sm: number;
		pf: number;
		tc: number;
		asb: number;
		ach: number;
		rubble: number;
		queue: {
			res: number[];
			plants: number[];
			rax: number[];
			sm: number[];
			pf: number[];
			tc: number[];
			asb: number[];
			ach: number[];
		};
	};
	landQueue?: number[];
	timestamp?: number;
}) {
	const buildingKeys = [
		"res",
		"plants",
		"rax",
		"sm",
		"pf",
		"tc",
		"asb",
		"ach",
		"rubble",
	] as const;

	const totalBuildings = land;
	const queueLength = 24;

	const renderQueueCell = (key: string, tickIndex: number) => {
		const queue = buildings.queue[key as keyof typeof buildings.queue];
		const value = queue?.[tickIndex] || 0;
		return <span key={tickIndex}>{value}</span>;
	};

	const renderQueueRow = (key: string) => {
		const cells = [];
		for (let i = 0; i < queueLength; i++) {
			cells.push(renderQueueCell(key, i));
		}
		return cells;
	};

	const queueHeader = [];
	for (let i = 0; i < queueLength; i++) {
		queueHeader.push(<span key={i}>{i + 1}</span>);
	}

	return (
		<article style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
			<header>
				<strong>{kdName} SOB</strong>
				{timestamp && (
					<span
						style={{ marginLeft: "0.5rem", color: "var(--pico-muted-color)" }}
					>
						{formatDate(timestamp)}
					</span>
				)}
			</header>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: `140px 80px 60px repeat(${queueLength}, 1fr)`,
					gap: "0.15rem",
					overflowX: "auto",
				}}
			>
				<span style={{ fontWeight: "bold" }}>Building</span>
				<span style={{ fontWeight: "bold" }}>Count</span>
				<span style={{ fontWeight: "bold" }}>%</span>
				{queueHeader}

				{buildingKeys.map((key) => {
					const count = buildings[key];
					const pct = totalBuildings > 0 ? (count / totalBuildings) * 100 : 0;
					return (
						<>
							<span key={`name-${key}`}>{BUILDING_NAMES[key]}</span>
							<span key={`count-${key}`}>{count.toLocaleString()}</span>
							<span key={`pct-${key}`}>{pct.toFixed(0)}%</span>
							{renderQueueRow(key)}
						</>
					);
				})}

				<span style={{ fontWeight: "bold" }}>Land</span>
				<span>{land.toLocaleString()}</span>
				<span>100%</span>
				{Array.from({ length: queueLength }, (_, i) => {
					const queueValue = landQueue?.[i] ?? 0;
					const tickNum = i + 1;
					return (
						<span key={`land-tick-${tickNum}`} style={{ fontWeight: "bold" }}>
							{queueValue}
						</span>
					);
				})}
			</div>
		</article>
	);
}
