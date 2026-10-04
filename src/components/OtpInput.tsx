import { useRef } from 'react';
import clsx from 'clsx';

export function OtpInput({ value, onChange, error, dark }: { value: string; onChange: (v: string) => void; error?: boolean; dark?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');
  const set = (i: number, d: string) => {
    const arr = value.padEnd(6, ' ').slice(0, 6).split('');
    arr[i] = d;
    onChange(arr.join('').replace(/\s+$/, ''));
  };
  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (p) {
        e.preventDefault();
        onChange(p);
        refs.current[Math.min(p.length, 5)]?.focus();
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d.trim()}
          autoFocus={i === 0}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            set(i, v || ' ');
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim() && i > 0) refs.current[i - 1]?.focus();
          }}
          className={clsx(
            'h-12 w-full max-w-[52px] rounded-xl border text-center text-xl font-bold outline-none transition focus:ring-2',
            dark ? 'border-white/15 bg-white/5 text-white focus:border-brand-400 focus:ring-brand-400/30' : 'border-ink-200 bg-white focus:border-brand-500 focus:ring-brand-500/20',
            error && 'border-red-400 animate-[wiggle_.3s]',
          )}
        />
      ))}
    </div>
  );
}
