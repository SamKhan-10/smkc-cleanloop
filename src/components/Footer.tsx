import { Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSelect } from './LanguageSelect';
import { useT } from '../i18n';
import { useStore } from '../lib/store';
import { toast } from './Toast';

export function Footer() {
  const t = useT();
  const reset = useStore((s) => s.resetDemo);
  const links = [
    ['/citizen', 'nav.citizen'],
    ['/municipal', 'nav.municipal'],
    ['/verifier', 'nav.verifier'],
    ['/live', 'nav.live'],
    ['/status', 'nav.status'],
    ['/how', 'nav.how'],
  ];
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 font-display text-sm font-extrabold tracking-[0.12em] text-brand-700">{t('tagline')}</p>
          <p className="mt-1 text-sm text-ink-500">{t('ft.desc')}</p>
          <p className="mt-4 flex max-w-md items-start gap-2 text-xs text-ink-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {t('home.privacy')}
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3 text-ink-400">{t('ft.platform')}</div>
          <ul className="space-y-2 text-sm">
            {links.map(([to, k]) => (
              <li key={to}>
                <Link to={to} className="font-medium text-ink-700 hover:text-brand-700">
                  {t(k)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3 text-ink-400">{t('nav.language')}</div>
          <LanguageSelect up />
          <button
            onClick={() => {
              if (confirm('Reset all demo records, accounts and activity to the initial demo dataset?')) {
                reset();
                toast('Demo dataset restored', 'All activity has been reset to the initial demo records.', 'info');
              }
            }}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
          </button>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SMKC CleanLoop · SMKC Civic Innovation Forum 2026</span>
          <span className="max-w-xl sm:text-right">{t('ft.demo')}</span>
        </div>
      </div>
    </footer>
  );
}
