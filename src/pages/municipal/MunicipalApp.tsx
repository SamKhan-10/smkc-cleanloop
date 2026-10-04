import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Route as RouteIcon, Siren, BarChart3, LogOut, Globe2, Menu, X, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useStaff, useStore } from '../../lib/store';
import { StaffAuth, ROLE_LABEL } from '../../components/StaffAuth';
import { LogoMark } from '../../components/Logo';
import { NotificationBell } from '../../components/NotificationBell';
import { LanguageSelect } from '../../components/LanguageSelect';
import { DemoTag } from '../../components/ui';
import Overview from './Overview';
import Complaints from './Complaints';
import ComplaintManage from './ComplaintManage';
import RouteOptimizer from './RouteOptimizer';
import Hotspots from './Hotspots';
import HotspotDetail from './HotspotDetail';
import WardAnalytics from './WardAnalytics';

export default function MunicipalApp() {
  const staff = useStaff();
  const logout = useStore((s) => s.logoutStaff);
  const detected = useStore((s) => s.hotspots.filter((h) => h.status === 'detected').length);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  if (!staff) return <StaffAuth mode="municipal" />;

  const nav = [
    { to: '/municipal', label: 'Command Overview', icon: LayoutDashboard, end: true },
    { to: '/municipal/complaints', label: 'Complaints', icon: ClipboardList },
    { to: '/municipal/routes', label: 'Route Optimization', icon: RouteIcon },
    { to: '/municipal/hotspots', label: 'Repeat Hotspots', icon: Siren, badge: detected },
    { to: '/municipal/wards', label: 'Ward Analytics', icon: BarChart3 },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/municipal" className="flex items-center gap-3 px-5 py-5">
        <LogoMark className="h-9 w-9" />
        <div className="leading-tight">
          <div className="font-display text-[13px] font-extrabold tracking-wide text-white">SMKC MUNICIPAL</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">Command Center</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-white/10 text-white' : 'text-ink-400 hover:bg-white/5 hover:text-white')
            }
          >
            <n.icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{n.label}</span>
            {!!n.badge && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-bold text-white">{staff.name.slice(0, 1)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{staff.name}</div>
            <div className="mono text-[11px] text-ink-400">{staff.staffId}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-md bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-200">{ROLE_LABEL[staff.role]}</span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-ink-300">Ward {staff.zone}</span>
          <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300"><ShieldCheck className="h-3 w-3" />Verified</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/" className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[11px] font-semibold text-ink-300 hover:bg-white/10"><Globe2 className="h-3.5 w-3.5" /> Public site</Link>
          <button onClick={logout} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[11px] font-semibold text-ink-300 hover:bg-white/10"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f6]">
      <aside className="fixed inset-y-0 left-0 z-[1001] hidden w-64 bg-ink-950 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-[1100] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink-950 page-enter">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-[1000] flex h-14 items-center justify-between gap-3 border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button className="btn-ghost !p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
            <span className="hidden text-sm font-semibold text-ink-500 sm:block">Sangli, Miraj & Kupwad City Municipal Corporation</span>
            <span className="text-sm font-bold text-ink-800 sm:hidden">Command Center</span>
          </div>
          <div className="flex items-center gap-1">
            <DemoTag className="mr-2 hidden sm:inline-flex" />
            <LanguageSelect />
            <NotificationBell audience="staff" linkBase="/municipal/complaints" />
          </div>
        </header>
        <main key={loc.pathname} className="page-enter p-4 sm:p-6">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="complaints/:id" element={<ComplaintManage />} />
            <Route path="routes" element={<RouteOptimizer />} />
            <Route path="hotspots" element={<Hotspots />} />
            <Route path="hotspots/:id" element={<HotspotDetail />} />
            <Route path="wards" element={<WardAnalytics />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
      {open && <button className="fixed right-4 top-3 z-[1101] rounded-full bg-white p-2 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>}
    </div>
  );
}
