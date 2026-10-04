import { create } from 'zustand';
import { CheckCircle2, Info, AlertTriangle, Siren } from 'lucide-react';
import clsx from 'clsx';

type Tone = 'success' | 'info' | 'warn' | 'alert';
interface Toast { id: number; title: string; body?: string; tone: Tone }

const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), t.tone === 'alert' ? 6500 : 4200);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = (title: string, body?: string, tone: Tone = 'success') => useToasts.getState().push({ title, body, tone });

const ICON = { success: CheckCircle2, info: Info, warn: AlertTriangle, alert: Siren };
const TONE = {
  success: 'text-emerald-600 bg-emerald-50',
  info: 'text-sky-600 bg-sky-50',
  warn: 'text-amber-600 bg-amber-50',
  alert: 'text-red-600 bg-red-50',
};

export function Toaster() {
  const { items, remove } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[2000] flex flex-col items-center gap-2 px-3 sm:items-end sm:right-4 sm:left-auto">
      {items.map((t) => {
        const I = ICON[t.tone];
        return (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            className={clsx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-pop page-enter',
              t.tone === 'alert' ? 'border-red-200' : 'border-ink-100',
            )}
          >
            <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full', TONE[t.tone])}>
              <I className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{t.title}</span>
              {t.body && <span className="mt-0.5 block text-xs text-ink-500">{t.body}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
