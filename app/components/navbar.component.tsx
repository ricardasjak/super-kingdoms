import { useAuth } from '@clerk/remix';
import { Link, useNavigate, useParams } from '@remix-run/react';
import { useCallback, useEffect, useState } from 'react';
import { KingdomNavbar } from '~/components/kd.navbar.component';
import { cx } from '~/cx';
import { GAME } from '~/game.const';
import { type PlayerKingdom } from '~/loaders';
import { routesUtil } from '~/routes.util';

type Props = {
	isLoggedIn: boolean;
	kingdoms: PlayerKingdom[];
};

export const Navbar: React.FC<Props> = ({ isLoggedIn, kingdoms }) => {
	const { signOut } = useAuth();
	const navigate = useNavigate();
	const [ctaClass, setCtaClass] = useState('animate-bounce');

	const params = useParams();
	const selected = Number(params?.kdid);
	const allowed = GAME.kingdomsLimit - kingdoms.length;
	let cta = allowed > 0 || !isLoggedIn ? 'Create kingdom' : '';
	if (allowed > 0 && kingdoms.length > 0) {
		cta = 'Expand Your Empire';
	}

	useEffect(() => {
		setTimeout(() => {
			setCtaClass('animate-none');
		}, 2400);
	}, []);

	const handSignOut = useCallback(() => {
		signOut().then(() => navigate(routesUtil.home));
	}, [navigate, signOut]);

	const handleClick = useCallback(() => {
		const elem = document.activeElement;
		if (elem) {
			// @ts-ignore
			elem?.blur();
		}
	}, []);

	return (
		<div className='bg-accent-content'>
			<div className='navbar px-0 py-0'>
				<div className='navbar-start'>
					<div className='dropdown'>
						<label tabIndex={0} className='btn btn-ghost text-primary'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M4 6h16M4 12h8m-8 6h16'
								/>
							</svg>
						</label>
						<ul
							tabIndex={0}
							className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'
						>
							{isLoggedIn && (
								<>
									<li>
										<label>Select your kingdom</label>
										<ul className='p-2'>
											{kingdoms.map(kd => (
												<li key={kd.id} onClick={handleClick}>
													<Link
														to={kd.news ? routesUtil.kd.news(kd.id) : routesUtil.kd.home(kd.id)}
														reloadDocument={false}
														className='indicator'
													>
														{kd.name}
														{!!kd.news && (
															<>
																&nbsp;&nbsp;
																<span className='indicator-item badge indicator-middle badge-sm badge-secondary'>
																	{kd.news}
																</span>
															</>
														)}
													</Link>
												</li>
											))}
											{allowed > 0 && (
												<li onClick={handleClick}>
													<Link to={routesUtil.kd.create} className='font-bold'>
														{cta}
													</Link>
												</li>
											)}
										</ul>
									</li>
									<li onClick={handleClick}>
										<Link to={routesUtil.account} className=''>
											My Account
										</Link>
									</li>
								</>
							)}
							<li onClick={handleClick}>
								{!isLoggedIn ? (
									<>
										<Link to={routesUtil.auth.signin} className=''>
											Login
										</Link>
										<Link to={routesUtil.auth.signup} className=''>
											Register
										</Link>
									</>
								) : (
									<Link to={routesUtil.home} onClick={handSignOut} className=''>
										Logout
									</Link>
								)}
							</li>
						</ul>
					</div>
					<Link className='btn btn-ghost text-primary' to={routesUtil.home}>
						WORLD MAP
					</Link>
				</div>
				<div className='navbar-center hidden lg:block max-w-3xl max-h-64 overflow-auto'>
					{isLoggedIn && (
						<ul className='p-2 flex flex-wrap gap-8 justify-evenly'>
							{kingdoms.map(kd => (
								<li key={kd.id} className={selected === kd.id ? 'text-primary' : undefined}>
									<Link
										to={kd.news ? routesUtil.kd.news(kd.id) : routesUtil.kd.status(kd.id)}
										prefetch='none'
										className={cx(
											'block text-base-content hover:text-secondary text-sm md: text-md',
											{
												'text-primary': selected === kd.id,
											}
										)}
										style={{ minWidth: '0px' }}
									>
										{`${kd.name}`}
										{!!kd.news && (
											<span
												className={
													'indicator-item badge indicator-middle badge-sm badge-secondary ml-1'
												}
											>
												{kd.news}
											</span>
										)}
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className='navbar-end mr-4'>
					{/*<KingdomLine />*/}
					{allowed > 0 && (
						<>
							<Link
								to={routesUtil.kd.create}
								className={cx('btn btn-primary btn-sm btn-outline ml-4', ctaClass)}
							>
								{cta}
							</Link>
						</>
					)}
					{!isLoggedIn && (
						<Link to={routesUtil.auth.signin} className='btn btn-ghost text-md text-primary'>
							Login
						</Link>
					)}
				</div>
			</div>
			<div className='hidden sm:block'>
				<KingdomNavbar />
			</div>
		</div>
	);
};
