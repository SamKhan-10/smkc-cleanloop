import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../lib/store';
import { useT } from '../i18n';
import { timeAgo } from '../lib/format';
import { notifText } from './notifText';

export function NotificationBell({ audience, citizenId, dark, linkBase }: { audience: 'citizen' | 'staff'; citizenId?: string; dark?: boolean; linkBase: string }) {
  const t = useT();
  const nav = useNavigate();
  const all = useStore((s) => s.notifications);
  const hotspots = useStore((s) => s.hotspots);
  const markRead = useStore((s) => s.markNotificationsRead);
  const items = all.filter((n) => n.audience === audience && (audience === 'staff' || n.citizenId === citizenId)).sort((a, b) => b.at - a.at);
  const unread = items.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(unread);
  const [ping, setPing] = useState(false);
  useEffect(() => {
    if (unread > prev.current) {
      setPing(true);
      const id = setTimeout(() => setPing(false), 1500);
      prev.current = unread;
      return () => clearTimeout(id);
    }
    prev.current = unread;
  }, [unread]);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (n: (typeof items)[number]) => {
    setOpen(false);
    if (n.hotspotId) nav(`/municipal/hotspots/${n.hotspotId}`);
    else if (n.complaintId) nav(audience === 'staff' ? `/municipal/complaints/${n.complaintId}` : `/issues/${n.complaintId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx('relative rounded-xl p-2 transition', dark ? 'text-ink-200 hover:bg-white/10' : 'text-ink-700 hover:bg-ink-100', ping && 'animate-bounce')}
        aria-label={t('nav.notifications')}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[1100] mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-ink-100 bg-white text-ink-900 shadow-pop page-enter">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="font-semibold">{t('nt.title')}</span>
            {unread > 0 && (
              <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => markRead(audience, citizenId)}>
                {t('nt.markRead')}
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-ink-500">{t('nt.empty')}</div>}
            {items.slice(0, 12).map((n) => {
              const { title, body } = notifText(n, t, hotspots);
              return (
                <button key={n.id} onClick={() => go(n)} className={clsx('flex w-full gap-3 border-b border-ink-50 px-4 py-3 text-left hover:bg-ink-50', !n.read && 'bg-brand-50/50')}>
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : n.kind === 'hotspot' ? 'bg-red-500' : n.kind === 'resolved' ? 'bg-emerald-500' : 'bg-brand-500')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug">{title}</span>
                    {body && <span className="mt-0.5 block text-xs text-ink-500">{body}</span>}
                    <span className="mt-1 block text-[11px] text-ink-400">{timeAgo(n.at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <Link to={linkBase} onClick={() => setOpen(false)} className="block bg-ink-50 px-4 py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-ink-100">
            {t('common.seeAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
