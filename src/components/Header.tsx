import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, LogOut, UserRound, ClipboardList, Bell } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import clsx from 'clsx';
import { Logo } from './Logo';
import { LanguageSelect } from './LanguageSelect';
import { NotificationBell } from './NotificationBell';
import { useT } from '../i18n';
import { useCitizen, useStore } from '../lib/store';

const NAV = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/live', key: 'nav.live' },
  { to: '/status', key: 'nav.status' },
  { to: '/municipal', key: 'nav.municipal' },
  { to: '/citizen', key: 'nav.citizen' },
];

export function Header() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const citizen = useCitizen();
  const logout = useStore((s) => s.logoutCitizen);
  const unread = useStore((s) => s.notifications.filter((n) => n.audience === 'citizen' && n.citizenId === citizen?.citizenId && !n.read).length);
  const accountMenu = citizen && (
    <AccountMenu
      title={t('cd.citizenId')}
      subtitle={citizen.citizenId}
      buttonLabel={citizen.citizenId}
      items={[
        { to: '/citizen/complaints', label: t('cd.myReports'), icon: <ClipboardList className="h-4 w-4" /> },
        { to: '/citizen/notifications', label: t('nav.notifications'), icon: <Bell className="h-4 w-4" />, badge: unread },
      ]}
      onSignOut={logout}
      signOutLabel={t('nav.signout')}
    />
  );
  useEffect(() => setOpen(false), [loc.pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative rounded-lg px-3 py-2 text-[13.5px] font-semibold transition whitespace-nowrap',
      isActive ? 'text-brand-800 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100/70',
    );

  return (
    <header className="sticky top-0 z-[1000] border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link to="/" className="shrink-0" aria-label="CivicSense home">
          <Logo />
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
              {t(n.key)}
            </NavLink>
          ))}
          <span className="mx-1.5 h-5 w-px bg-ink-200" />
          {citizen && <NotificationBell audience="citizen" citizenId={citizen.citizenId} linkBase="/citizen/notifications" />}
          {accountMenu}
          <LanguageSelect />
          <NavLink to="/how" className={linkCls}>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {t('nav.how')}
            </span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-1 xl:hidden">
          {citizen && <NotificationBell audience="citizen" citizenId={citizen.citizenId} linkBase="/citizen/notifications" />}
          <button className="btn-ghost !p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-ink-100 bg-white page-enter">
          <nav className="container-x flex flex-col gap-1 py-3">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx('rounded-xl px-3 py-3 text-[15px] font-semibold', isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-700')}>
                {t(n.key)}
              </NavLink>
            ))}
            <div className="px-1 py-2">
              <LanguageSelect full />
            </div>
            <NavLink to="/how" className={({ isActive }) => clsx('rounded-xl px-3 py-3 text-[15px] font-semibold', isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-700')}>
              {t('nav.how')}
            </NavLink>
            {citizen && (
              <div className="mt-2 rounded-xl bg-ink-50 p-2 text-sm">
                <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-ink-700">
                  <UserRound className="h-4 w-4" /> {t('cd.citizenId')}: <span className="mono">{citizen.citizenId}</span>
                </div>
                <NavLink to="/citizen/complaints" className="flex items-center gap-2 rounded-lg px-2 py-2 text-ink-700"><ClipboardList className="h-4 w-4" /> {t('cd.myReports')}</NavLink>
                <NavLink to="/citizen/notifications" className="flex items-center gap-2 rounded-lg px-2 py-2 text-ink-700"><Bell className="h-4 w-4" /> {t('nav.notifications')}{unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}</NavLink>
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-semibold text-red-600">
                  <LogOut className="h-4 w-4" /> {t('nav.signout')}
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
