import { Link } from 'react-router-dom';
import { Camera, ClipboardList, Map as MapIcon, Bell, LogOut, ShieldCheck, ArrowRight, Star, FileText, CheckCircle2, Timer } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '../../i18n';
import { useCitizen, useStore } from '../../lib/store';
import type { Complaint } from '../../lib/types';
import { bucketOf } from '../../lib/status';
import { fmtWhen, timeAgo } from '../../lib/format';
import { CitizenGate } from '../../components/CitizenAuth';
import { PriorityBadge, ProgressBar, StatusBadge } from '../../components/badges';
import { EvidenceImage } from '../../components/EvidenceImage';
import { EmptyState } from '../../components/ui';
import { notifText } from '../../components/notifText';
import { wardByNo } from '../../lib/geo';
import { useWardStatuses } from '../../lib/useWardStatus';
import { LEVEL_KEY } from '../../lib/wardStatus';
import { StatusStars, LEVEL_TONE } from '../../components/StatusStars';

function useMine() {
  const citizen = useCitizen();
  const complaints = useStore((s) => s.complaints);
  return complaints.filter((c) => c.citizenId === citizen?.citizenId);
}

export function ReportRow({ c }: { c: Complaint }) {
  const t = useT();
  const needsFeedback = c.status === 'verified_resolved' && !c.feedback;
  return (
    <Link to={`/issues/${c.id}`} className="group flex gap-4 rounded-2xl border border-ink-100 bg-white p-3 shadow-card transition hover:shadow-lift sm:p-4">
      <EvidenceImage src={c.evidence.image} alt="" className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-28" w={300} h={220} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink-900">{t(`type.${c.type}`)} #{c.num}</div>
            <div className="text-xs text-ink-500">
              <span className="mono font-semibold text-ink-700">{c.id}</span> · {t('common.ward')} {c.wardNo} · {t('cd.submitted')} {fmtWhen(c.createdAt)}
            </div>
          </div>
          <PriorityBadge priority={c.priority} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} />
          {needsFeedback && <span className="chip bg-amber-50 text-amber-800 ring-amber-200"><Star className="h-3 w-3" /> {t('cd.awaitingFeedback')}</span>}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar status={c.status} className="flex-1" />
          <span className="hidden items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-700 sm:flex">
            {t('common.viewDetails')} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Dashboard() {
  const t = useT();
  const citizen = useCitizen()!;
  const logout = useStore((s) => s.logoutCitizen);
  const notifications = useStore((s) => s.notifications).filter((n) => n.audience === 'citizen' && n.citizenId === citizen.citizenId);
  const mine = useMine();
  const unread = notifications.filter((n) => !n.read).length;
  const resolved = mine.filter((c) => c.status === 'verified_resolved');
  const active = mine.filter((c) => bucketOf(c.status) !== 'resolved');
  const feedbackDue = resolved.filter((c) => !c.feedback);
  const homeWard = mine[0] ? wardByNo(mine[0].wardNo) : null;
  const wardStatuses = useWardStatuses();
  const myWard = homeWard ? wardStatuses.find((w) => w.wardNo === homeWard.no) : undefined;
  const statusLink = homeWard ? `/status?ward=${homeWard.no}` : '/status';

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t('cd.welcome')}</h1>
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-sm ring-1 ring-brand-100">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span className="text-ink-600">{t('cd.citizenId')}:</span>
            <span className="mono font-bold text-brand-800">{citizen.citizenId}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/report" className="btn-primary"><Camera className="h-4 w-4" /> {t('common.report')}</Link>
          <button onClick={logout} className="btn-secondary"><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t('nav.signout')}</span></button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [FileText, mine.length, t('cd.myReports'), 'bg-brand-50 text-brand-700'],
          [Timer, active.length, t('cd.active'), 'bg-amber-50 text-amber-600'],
          [CheckCircle2, resolved.length, t('cd.verified'), 'bg-emerald-50 text-emerald-600'],
        ].map(([I, v, l, tone]) => {
          const Icon = I as typeof Timer;
          return (
            <div key={l as string} className="card p-4">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
              <div className="mt-3 font-display text-3xl font-extrabold tabular-nums">{v as number}</div>
              <div className="text-xs font-medium text-ink-500">{l as string}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { to: '/report', icon: Camera, label: `📸 ${t('common.report')}`, primary: true },
          { to: '/citizen/complaints', icon: ClipboardList, label: `📋 ${t('cd.track')}` },
          { to: '/citizen/notifications', icon: Bell, label: `🔔 ${t('nav.notifications')}`, badge: unread },
          { to: statusLink, icon: Star, label: `⭐ ${t('nav.status')}` },
          { to: '/live', icon: MapIcon, label: `🗺️ ${t('nav.live')}` },
        ].map((a) => (
          <Link key={a.to} to={a.to} className={clsx('relative flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold transition hover:shadow-lift', a.primary ? 'bg-brand-700 text-white shadow-card hover:bg-brand-800' : 'card')}>
            {a.label}
            {!!a.badge && <span className="absolute right-3 top-3 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{a.badge}</span>}
          </Link>
        ))}
      </div>

      {feedbackDue.length > 0 && (
        <Link to={`/issues/${feedbackDue[0].id}`} className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-600 p-4 text-white shadow-lift transition hover:bg-emerald-700">
          <Bell className="h-6 w-6 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">🔔 {t('nt.resolved', { id: feedbackDue[0].id })}</div>
            <div className="text-sm text-emerald-50">{t('nt.resolvedSub')}</div>
          </div>
          <span className="hidden rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 sm:block">★ {t('nt.rate')}</span>
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('cd.recent')}</h2>
            {mine.length > 4 && <Link to="/citizen/complaints" className="text-sm font-semibold text-brand-700">{t('common.seeAll')}</Link>}
          </div>
          {mine.length === 0 ? (
            <EmptyState icon={<Camera className="h-5 w-5" />} title={t('cd.empty')} sub={t('cd.emptySub')} action={<Link to="/report" className="btn-primary"><Camera className="h-4 w-4" /> {t('common.report')}</Link>} />
          ) : (
            <div className="space-y-3">{mine.slice(0, 4).map((c) => <ReportRow key={c.id} c={c} />)}</div>
          )}
        </section>
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{t('nav.notifications')}</h3>
              <Link to="/citizen/notifications" className="text-xs font-semibold text-brand-700">{t('common.seeAll')}</Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-ink-500">{t('nt.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {notifications.slice(0, 4).map((n) => {
                  const { title } = notifText(n, t);
                  return (
                    <li key={n.id}>
                      <Link to={`/issues/${n.complaintId}`} className="flex gap-2.5 text-sm">
                        <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-ink-200' : n.kind === 'resolved' ? 'bg-emerald-500' : 'bg-brand-500')} />
                        <span>
                          <span className="block font-medium leading-snug text-ink-800">{title}</span>
                          <span className="text-[11px] text-ink-400">{timeAgo(n.at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{t('cd.wardStatus')}</h3>
              <Link to={statusLink} className="text-xs font-semibold text-brand-700">{t('common.seeAll')}</Link>
            </div>
            {myWard ? (
              <Link to={statusLink} className="block">
                <div className="font-display text-sm font-extrabold tracking-[0.12em] text-ink-900">{t('common.ward').toUpperCase()} {myWard.wardNo}</div>
                <div className="text-xs text-ink-500">{myWard.name}</div>
                <div className="mt-3"><StatusStars level={myWard.level} /></div>
                <div className={clsx('mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', LEVEL_TONE[myWard.level].bg, LEVEL_TONE[myWard.level].text, LEVEL_TONE[myWard.level].ring)}>
                  <span className={clsx('h-1.5 w-1.5 rounded-full', LEVEL_TONE[myWard.level].dot)} />
                  {t('ws.statusLabel', { level: t(`ws.${LEVEL_KEY[myWard.level]}`) })}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {myWard.highlights.slice(0, 2).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-ink-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{t(h)}</li>
                  ))}
                </ul>
              </Link>
            ) : (
              <Link to="/status" className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-800">
                <span>{t('cd.wardStatusEmpty')}</span> <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MyComplaints() {
  const t = useT();
  const mine = useMine();
  return (
    <div className="container-x py-6 sm:py-10">
      <Link to="/citizen" className="btn-ghost -ml-3 mb-2">← {t('cd.welcome')}</Link>
      <h1 className="text-2xl font-extrabold">{t('cd.myComplaints')}</h1>
      <div className="mt-5 space-y-3">
        {mine.length === 0 ? (
          <EmptyState icon={<Camera className="h-5 w-5" />} title={t('cd.empty')} sub={t('cd.emptySub')} action={<Link to="/report" className="btn-primary">{t('common.report')}</Link>} />
        ) : (
          mine.map((c) => <ReportRow key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}

function Notifications() {
  const t = useT();
  const citizen = useCitizen()!;
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationsRead);
  const complaints = useStore((s) => s.complaints);
  const items = all.filter((n) => n.audience === 'citizen' && n.citizenId === citizen.citizenId).sort((a, b) => b.at - a.at);
  return (
    <div className="container-x max-w-3xl py-6 sm:py-10">
      <Link to="/citizen" className="btn-ghost -ml-3 mb-2">← {t('cd.welcome')}</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t('nt.title')}</h1>
        {items.some((n) => !n.read) && <button className="btn-secondary btn-sm" onClick={() => markRead('citizen', citizen.citizenId)}>{t('nt.markRead')}</button>}
      </div>
      <div className="mt-5 space-y-3">
        {items.length === 0 && <EmptyState icon={<Bell className="h-5 w-5" />} title={t('nt.empty')} />}
        {items.map((n) => {
          const { title, body } = notifText(n, t);
          const c = complaints.find((x) => x.id === n.complaintId);
          const resolved = n.kind === 'resolved';
          return (
            <div key={n.id} className={clsx('card flex gap-4 p-4', !n.read && 'ring-2 ring-brand-200', resolved && 'border-emerald-200')}>
              <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', resolved ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-700')}>
                {resolved ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink-900">{resolved && '🔔 '}{title}</div>
                {body && <div className="text-sm text-ink-500">“{body}”</div>}
                <div className="mt-1 text-xs text-ink-400">{timeAgo(n.at)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/issues/${n.complaintId}`} className="btn-secondary btn-sm">{resolved ? 'View before / after' : t('common.viewDetails')}</Link>
                  {resolved && c && !c.feedback && <Link to={`/issues/${n.complaintId}`} className="btn-primary btn-sm">★ {t('nt.rate')}</Link>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CitizenPortal({ view = 'dashboard' }: { view?: 'dashboard' | 'complaints' | 'notifications' }) {
  return <CitizenGate>{view === 'complaints' ? <MyComplaints /> : view === 'notifications' ? <Notifications /> : <Dashboard />}</CitizenGate>;
}
