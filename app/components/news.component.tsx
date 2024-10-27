import { Link } from '@remix-run/react';
import { type PersonalAttackNews, type PersonalNews, type PersonalProbeNews } from '~/app.model';
import { cx } from '~/cx';
import { routesUtil } from '~/routes.util';
import { militaryUtil, timeDiff } from '~/utils';

interface Props {
	newsList: PersonalNews[];
}

export const NewsComponent: React.FC<Props> = ({ newsList }) => {
	return (
		<ul>
			{newsList.map(n => {
				if ('probing' in n) {
					const news = n as PersonalProbeNews;
					const probing = n.probing;
					return (
						<li key={news.id} className='mt-4'>
							<div
								className='grid grid-cols-2 my-2 gap-2'
								style={{ gridTemplateColumns: 'max-content 4fr' }}
							>
								<div className=''>
									{/*<span>{new Date(n.at).toISOString().substring(11, 19)}</span>*/}
									{/*&nbsp;*/}
									<span>{timeDiff(new Date().getTime() - new Date(n.at).getTime())} ago.</span>
									{/*&nbsp;*/}

									{/*<span className={cx('col-span-2', news.success ? '' : '')}>{news.report}.</span>*/}
								</div>
								<div>
									{!probing.success && (
										<div>
											<span className=''>
												{news.attackerId ? (
													<Link
														to={routesUtil.world.target(news.attackerId)}
														className='text-secondary'
													>
														{n.attackerName}&nbsp;
													</Link>
												) : (
													<>Unknown kingdom</>
												)}
											</span>
											probed us.
											<p className='text-green-500'>
												Our probes defense managed to stop their mission. They lost{' '}
												<strong>{probing.probesLost}</strong> probes. Estimated defense success rate
												was {100 - probing.successPercentage}%
											</p>
										</div>
									)}
									{probing.success && (
										<div>
											<p className=''>
												We have been infiltrated by probes. Our intelligence office hasn't managed
												to identify the target.
											</p>
										</div>
									)}
								</div>
							</div>
						</li>
					);
				}
				const news = n as PersonalAttackNews;
				const attack = news.attack;
				return (
					<li key={news.id} className='mt-4'>
						<div
							className='grid grid-cols-2 my-2 gap-2'
							style={{ gridTemplateColumns: 'max-content 4fr' }}
						>
							{/*<span>{new Date(n.at).toISOString().substring(11, 19)}</span>*/}
							{/*&nbsp;*/}
							<span>{timeDiff(new Date().getTime() - new Date(n.at).getTime())} ago.</span>

							<div className='ml-2'>
								<Link to={routesUtil.world.target(news.attackerId)} className='text-secondary'>
									{news.attackerName}&nbsp;
								</Link>
								military forces invaded our lands.
								<span className={cx(attack.success ? '' : 'text-green-500')}>
									{attack.success
										? ' Unfortunately, our defensive forces had to retreat.'
										: ' Our defensive forces managed to repeal the attack.'}
								</span>
								{attack.success && attack.gains && (
									<p>
										We lost some resources:{' '}
										<strong className='text-red-600'>
											{militaryUtil.getAttackerGainsNews(attack.gains).join(', ')}.
										</strong>
									</p>
								)}
								<p>
									We lost{' '}
									{militaryUtil.getLostUnitsNews(attack.defenderLosses).join(', ') || '0 units'},
									and we killed some enemy units:{' '}
									{militaryUtil.getLostUnitsNews(attack.attackerLosses).join(', ') || '0 units'}.
								</p>
								<p>
									Estimated defence success chance was estimated at{' '}
									<strong>{100 - attack.successPercentage}%</strong>
								</p>
							</div>
							{/*<span className={cx('col-span-2', news.success ? '' : '')}>{news.}.</span>*/}
						</div>
					</li>
				);
			})}
		</ul>
	);
};
