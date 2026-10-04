import { useEffect, type ReactNode } from 'react';
import { X, Database } from 'lucide-react';
import clsx from 'clsx';

export function DemoTag({ label = 'DEMO DATA', className }: { label?: string; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border border-dashed border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800',
        className,
      )}
      title="Illustrative data for demonstration — not official SMKC figures"
    >
      <Database className="h-3 w-3" />
      {label}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, sub, right }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow text-brand-600 mb-1">{eyebrow}</div>}
        <h2 className="text-xl sm:text-2xl font-bold text-ink-900">{title}</h2>
        {sub && <p className="mt-1 text-sm text-ink-500 max-w-2xl">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] page-enter" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative w-full max-h-[92vh] overflow-y-auto bg-white shadow-pop rounded-t-3xl sm:rounded-3xl page-enter',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="font-display text-lg font-bold">{title}</div>
          <button className="btn-ghost !p-2 rounded-full" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  dark,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={clsx('inline-flex flex-wrap gap-1 rounded-xl p-1', dark ? 'bg-white/5' : 'bg-ink-100/80', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            value === o.value
              ? dark
                ? 'bg-white text-ink-900 shadow'
                : 'bg-white text-ink-900 shadow-sm'
              : dark
                ? 'text-ink-300 hover:text-white'
                : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={clsx('rounded-full px-1.5 text-[10px]', value === o.value ? 'bg-brand-100 text-brand-800' : dark ? 'bg-white/10' : 'bg-ink-200/70')}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: ReactNode; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</div>
      <div className="font-semibold text-ink-800">{title}</div>
      {sub && <p className="mt-1 max-w-sm text-sm text-ink-500">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stars({ value, onChange, size = 'h-8 w-8' }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={clsx('transition', onChange && 'hover:scale-110')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <svg viewBox="0 0 24 24" className={clsx(size, n <= value ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200')} stroke="currentColor" strokeWidth="1">
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
