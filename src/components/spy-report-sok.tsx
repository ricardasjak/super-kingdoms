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
	const defPower: Record<string, number> = {
		sol: 5,
		tr: 8,
		dr: 12,
		ft: 15,
		lt: 5,
		ld: 8,
		lf: 12,
		t: 25,
		hgl: 40,
		ht: 30,
	};

	let total = 0;
	for (const [unit, count] of Object.entries(military)) {
		total += (defPower[unit] || 0) * count;
	}
	return Math.floor(total * 100);
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
	const offPower: Record<string, number> = {
		tr: 12,
		dr: 18,
		ft: 25,
		tf: 30,
		lt: 8,
		ld: 12,
		lf: 20,
		f74: 5,
		t: 40,
		hgl: 60,
		ht: 50,
	};

	let total = 0;
	for (const [unit, count] of Object.entries(military)) {
		total += (offPower[unit] || 0) * count;
	}
	return Math.floor(total * 100);
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
	timestamp?: number;
}) {
	return (
		<article style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
			<header>
				<strong>
					{kdName} ({level})
				</strong>
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
					gridTemplateColumns: "140px 1fr",
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
					gridTemplateColumns: "140px 1fr",
					gap: "0.15rem",
				}}
			>
				<span>Soldiers:</span>
				<span>{military.sol.toLocaleString()}</span>
				<span>Laser Troopers:</span>
				<span>{military.tr.toLocaleString()}</span>
				<span>Laser Dragoons:</span>
				<span>{military.dr.toLocaleString()}</span>
				<span>Laser Fighters:</span>
				<span>{military.ft.toLocaleString()}</span>
				<span>F74 Interceptor Drones:</span>
				<span>{military.f74.toLocaleString()}</span>
				<span>High Guard Lancers:</span>
				<span>{military.hgl.toLocaleString()}</span>
				<span>Tanks:</span>
				<span>{military.t.toLocaleString()}</span>
				<span>Hover Tanks:</span>
				<span>{military.ht.toLocaleString()}</span>
				<span>Troopers:</span>
				<span>{military.lt.toLocaleString()}</span>
				<span>Dragoons:</span>
				<span>{military.ld.toLocaleString()}</span>
				<span>Fighters:</span>
				<span>{military.lf.toLocaleString()}</span>
				<span>Tactical Fighters:</span>
				<span>{military.tf.toLocaleString()}</span>
			</div>
			<hr style={{ margin: "0.4rem 0" }} />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "140px 1fr",
					gap: "0.15rem",
				}}
			>
				<span>Max Def. Potential:</span>
				<span>{maxDefPotential.toLocaleString()}</span>
				<span>Max Off. Potential:</span>
				<span>{maxOffPotential.toLocaleString()}</span>
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
