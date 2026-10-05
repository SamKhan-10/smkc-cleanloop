import clsx from 'clsx';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={clsx('shrink-0', className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#176556" />
      <path d="M20 9.5a10.5 10.5 0 1 0 9.9 14" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M26.6 18.6l3.6 4.9 3.6-5.4" fill="none" stroke="#80d2b9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.2" fill="#80d2b9" />
    </svg>
  );
}

export function Logo({ dark, sub = true }: { dark?: boolean; sub?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9" />
      <span className="leading-none">
        <span className={clsx('block font-display text-[17px] font-extrabold tracking-tight', dark ? 'text-white' : 'text-ink-900')}>
          Civic<span className={dark ? 'text-brand-300' : 'text-brand-600'}>Sense</span>
        </span>
        {sub && <span className={clsx('mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.16em]', dark ? 'text-ink-400' : 'text-ink-500')}>SMKC · Civic Platform</span>}
      </span>
    </span>
  );
}
