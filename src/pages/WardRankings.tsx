import { useState } from 'react';
import { Trophy, TrendingUp, Info, Medal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';
import { useT } from '../i18n';
import { useRankings } from '../lib/useRankings';
import { COMPONENTS, MONTHS } from '../lib/rankings';
import { ZONES, zoneById } from '../lib/geo';
import { ZONE_COLOR } from '../lib/status';
import { DemoTag, Segmented } from '../components/ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function WardRankings() {
  const t = useT();
  const [tab, setTab] = useState<'monthly' | 'overall'>('monthly');
  const scores = useRankings();
  const monthly = [...scores].sort((a, b) => b.score - a.score);
  const overall = [...scores].sort((a, b) => b.overall - a.overall);
  const best = overall[0];
  const trend = MONTHS.map((m, i) => ({ month: m.slice(0, 3), ...Object.fromEntries(scores.map((s) => [`Ward ${s.zone}`, s.monthly[i]])) }));

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow text-brand-600">🏆 {t('nav.rankings')}</div>
          <h1 className="mt-1 text-3xl font-extrabold">{t('rk.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{t('rk.sub')}</p>
        </div>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'monthly', label: t('rk.monthly') }, { value: 'overall', label: t('rk.overall') }]} />
      </div>

      {tab === 'monthly' ? (
        <div className="mt-8 page-enter">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-extrabold tracking-wide text-ink-900">{t('rk.monthlyTitle')}</h2>
            <DemoTag />
            <span className="text-xs text-ink-500">· {t('rk.live')}</span>
          </div>

          {/* podium */}
          <div className="mt-6 grid items-end gap-4 sm:grid-cols-3">
            {[monthly[1], monthly[0], monthly[2]].map((s) => {
              const rank = monthly.indexOf(s);
              const z = zoneById(s.zone);
              return (
                <div
                  key={s.zone}
                  className={clsx(
                    'card relative overflow-hidden p-5 text-center',
                    rank === 0 ? 'order-first border-amber-200 sm:order-none sm:pb-10 sm:pt-8' : 'sm:pb-6',
                  )}
                >
                  {rank === 0 && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />}
                  <div className="text-4xl">{MEDALS[rank]}</div>
                  <div className="mt-2 font-display text-xl font-extrabold">{z.name}</div>
                  <div className="text-xs text-ink-500">{z.area}</div>
                  <div className="mt-3 font-display text-5xl font-extrabold tabular-nums" style={{ color: rank === 0 ? '#b45309' : '#1f2430' }}>{s.score}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{t('rk.score')} / 100</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 card divide-y divide-ink-100">
            {monthly.map((s, i) => {
              const z = zoneById(s.zone);
              return (
                <div key={s.zone} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-8 text-center text-xl">{MEDALS[i] ?? <span className="font-display text-base font-bold text-ink-400">{i + 1}.</span>}</span>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ZONE_COLOR[s.zone] }} />
                  <div className="w-36 shrink-0">
                    <div className="font-bold">{z.name}</div>
                    <div className="text-xs text-ink-500">{z.area}</div>
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: ZONE_COLOR[s.zone] }} />
                  </div>
                  <span className="w-12 text-right font-display text-xl font-extrabold tabular-nums">{s.score}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-lg font-bold">{t('rk.components')}</h3>
              <DemoTag />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {COMPONENTS.map((comp) => (
                <div key={comp.key} className="card p-4">
                  <div className="text-sm font-bold text-ink-900">{t(`rk.c.${comp.key}`)}</div>
                  <div className="text-[11px] text-ink-400">weight {Math.round(comp.weight * 100)}%</div>
                  <div className="mt-4 space-y-2.5">
                    {monthly.map((s) => (
                      <div key={s.zone} className="flex items-center gap-2 text-xs" title={`Ward ${s.zone}: ${Math.round(s.metrics[comp.key])}`}>
                        <span className="w-4 font-semibold text-ink-600">{s.zone}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${s.metrics[comp.key]}%`, background: ZONE_COLOR[s.zone] }} />
                        </div>
                        <span className="w-6 text-right font-semibold tabular-nums text-ink-700">{Math.round(s.metrics[comp.key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-ink-50 p-4 text-xs text-ink-600 ring-1 ring-ink-100">
              <Info className="h-4 w-4 shrink-0 text-brand-600" />
              <span>
                <b>{t('rk.method')}:</b> {COMPONENTS.map((c) => `${t(`rk.c.${c.key}`)} ${Math.round(c.weight * 100)}%`).join(' · ')}. Resolution counts only ground-verified closures; hotspot reduction rewards completed root-cause investigations.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 page-enter">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-extrabold tracking-wide">{t('rk.overall').toUpperCase()}</h2>
            <DemoTag />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 text-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-50"><Trophy className="h-4 w-4" /> {t('rk.best')}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-5xl">🥇</span>
                  <div>
                    <div className="font-display text-3xl font-extrabold">{zoneById(best.zone).name}</div>
                    <div className="text-sm text-amber-50">{zoneById(best.zone).area}</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t('rk.overallScore')}</div>
                <div className="font-display text-6xl font-extrabold text-ink-900">{best.overall}</div>
                <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <TrendingUp className="h-4 w-4" /> +{best.monthly[5] - best.monthly[0]} since May
                </div>
                <div className="mt-5 space-y-2">
                  {overall.map((s, i) => (
                    <div key={s.zone} className="flex items-center gap-3 text-sm">
                      <span className="w-6">{MEDALS[i] ?? <Medal className="h-4 w-4 text-ink-300" />}</span>
                      <span className="flex-1 font-semibold">Ward {s.zone}</span>
                      <span className="font-display font-bold tabular-nums">{s.overall}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-bold">{t('rk.trend')}</h3>
                <span className="text-xs text-ink-400">May – Oct 2026</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 16, right: 16, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="#eceef2" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    {ZONES.map((z) => (
                      <Line key={z.id} type="monotone" dataKey={`Ward ${z.id}`} stroke={ZONE_COLOR[z.id]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-ink-400">
                      <th className="py-2 pr-3 font-semibold">Ward</th>
                      {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-right font-semibold">{m.slice(0, 3)}</th>)}
                      <th className="py-2 pl-2 text-right font-semibold">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overall.map((s) => (
                      <tr key={s.zone} className="border-t border-ink-100">
                        <td className="py-2 pr-3 font-semibold"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: ZONE_COLOR[s.zone] }} />Ward {s.zone}</td>
                        {s.monthly.map((v, i) => <td key={i} className="px-2 py-2 text-right tabular-nums text-ink-700">{v}</td>)}
                        <td className="py-2 pl-2 text-right font-bold tabular-nums">{s.overall}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
