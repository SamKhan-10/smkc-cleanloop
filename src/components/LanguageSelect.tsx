import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { LANGS } from '../i18n';
import { useStore } from '../lib/store';

export function LanguageSelect({ dark, up, full }: { dark?: boolean; up?: boolean; full?: boolean }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const cur = LANGS.find((l) => l.id === lang)!;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition',
          dark ? 'text-ink-200 hover:bg-white/10' : 'text-ink-700 hover:bg-ink-100',
          full && 'w-full justify-between border border-ink-200',
        )}
        aria-label="Language"
      >
        <Globe className="h-4 w-4" />
        <span>{cur.label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div className={clsx('absolute right-0 z-[1100] w-44 rounded-xl border border-ink-100 bg-white p-1 shadow-pop page-enter', up ? 'bottom-full mb-2' : 'mt-2')}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className={clsx('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-800 hover:bg-ink-50', l.id === lang && 'font-semibold text-brand-700')}
            >
              {l.label}
              {l.id === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
