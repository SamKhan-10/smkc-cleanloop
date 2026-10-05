import { Link } from 'react-router-dom';
import { Bell, Siren, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../lib/store';
import { useT } from '../../i18n';
import { timeAgo } from '../../lib/format';
import { notifText } from '../../components/notifText';
import { EmptyState } from '../../components/ui';
import { PageHead, Panel } from './shared';

export default function MunicipalNotifications() {
  const t = useT();
  const all = useStore((s) => s.notifications);
  const hotspots = useStore((s) => s.hotspots);
  const markRead = useStore((s) => s.markNotificationsRead);
  const items = all.filter((n) => n.audience === 'staff').sort((a, b) => b.at - a.at);
  return (
    <div>
      <PageHead
        title="Notifications"
        sub="New geo-verified complaints and repeat-hotspot alerts for the municipal team."
        right={items.some((n) => !n.read) ? <button className="btn-secondary btn-sm" onClick={() => markRead('staff')}>Mark all as read</button> : undefined}
      />
      <Panel className="divide-y divide-ink-100">
        {items.length === 0 && <div className="p-6"><EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications yet." /></div>}
        {items.slice(0, 60).map((n) => {
          const { title, body } = notifText(n, t, hotspots);
          const to = n.hotspotId ? `/municipal/hotspots/${n.hotspotId}` : `/municipal/complaints/${n.complaintId}`;
          return (
            <Link key={n.id} to={to} className={clsx('flex gap-3 px-4 py-3 hover:bg-ink-50', !n.read && 'bg-brand-50/40')}>
              <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', n.kind === 'hotspot' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700')}>
                {n.kind === 'hotspot' ? <Siren className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink-900">{title}</div>
                {body && <div className="text-xs text-ink-500">{body}</div>}
                <div className="mt-0.5 text-[11px] text-ink-400">{timeAgo(n.at)}</div>
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
            </Link>
          );
        })}
      </Panel>
    </div>
  );
}
