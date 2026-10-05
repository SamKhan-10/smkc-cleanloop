import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import clsx from 'clsx';

export interface AccountMenuItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

/** Compact account dropdown: identity header, a few links and Sign Out. */
export function AccountMenu({
  title,
  subtitle,
  items,
  onSignOut,
  signOutLabel,
  dark,
  buttonLabel,
}: {
  title: string;
  subtitle?: string;
  items: AccountMenuItem[];
  onSignOut: () => void;
  signOutLabel: string;
  dark?: boolean;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={clsx('flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition', dark ? 'text-ink-700 hover:bg-ink-100' : 'text-ink-700 hover:bg-ink-100')}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white"><UserRound className="h-4 w-4" /></span>
        <span className="mono hidden text-xs sm:inline">{buttonLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-[1100] mt-2 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white text-ink-900 shadow-pop page-enter">
          <div className="border-b border-ink-100 px-4 py-3">
            <div className="text-sm font-bold">{title}</div>
            {subtitle && <div className="mono mt-0.5 text-xs text-ink-500">{subtitle}</div>}
          </div>
          <div className="p-1">
            {items.map((it) => (
              <Link key={it.to} to={it.to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                <span className="text-ink-400">{it.icon}</span>
                <span className="flex-1">{it.label}</span>
                {!!it.badge && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{it.badge}</span>}
              </Link>
            ))}
            <button onClick={onSignOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> {signOutLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
