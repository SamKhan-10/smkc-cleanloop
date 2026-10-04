import { Link } from 'react-router-dom';
import { Camera, ScanSearch, Building2, Route, Sparkles, BadgeCheck, MessageSquareHeart, ShieldAlert, ArrowDown, Lock, Fingerprint, History, Satellite, UserCheck, KeyRound } from 'lucide-react';
import { useT } from '../i18n';

const STEPS = [
  [Camera, 'bg-brand-600'],
  [ScanSearch, 'bg-sky-600'],
  [Building2, 'bg-indigo-600'],
  [Route, 'bg-blue-600'],
  [Sparkles, 'bg-amber-500'],
  [BadgeCheck, 'bg-violet-600'],
  [MessageSquareHeart, 'bg-emerald-600'],
  [ShieldAlert, 'bg-red-600'],
] as const;

export default function HowItWorks() {
  const t = useT();
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow text-brand-600">{t('tagline')}</div>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('hw.title')}</h1>
        <p className="mt-2 text-ink-500">{t('hw.sub')}</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {STEPS.map(([Icon, tone], i) => (
          <div key={i}>
            <div className="card flex items-center gap-4 p-4 sm:gap-6 sm:p-5">
              <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-lift ${tone}`}>
                <Icon className="h-6 w-6" />
                <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-[11px] font-bold text-white ring-2 ring-white">{i + 1}</span>
              </span>
              <div>
                <div className="font-display text-lg font-extrabold tracking-wide">{t(`hw.s${i + 1}`)}</div>
                <div className="text-sm text-ink-600">{t(`hw.s${i + 1}d`)}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex justify-center py-1.5 text-ink-300">
                <ArrowDown className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-center text-white shadow-pop sm:p-10">
        <p className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
          “{t('hw.final1')}
          <br />
          <span className="text-brand-300">{t('hw.final2')}”</span>
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/report" className="btn bg-white text-brand-800 hover:bg-brand-50"><Camera className="h-4 w-4" /> {t('common.report')}</Link>
          <Link to="/live" className="btn bg-white/10 text-white hover:bg-white/15">{t('common.viewLive')}</Link>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-5xl">
        <h2 className="text-center text-xl font-bold">{t('hw.trust')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [UserCheck, 'Role-based access', 'Citizen, Municipal Officer, Ward Officer, Field Staff, Ground Verifier and Public views each see only what they need.'],
            [Fingerprint, 'Anonymous Citizen IDs', 'Public and municipal screens show Citizen IDs (e.g. C-10482) — never names, emails or phone numbers.'],
            [KeyRound, 'OTP verification', 'Citizens and staff sign in with one-time passwords; municipal staff also submit a supporting document.'],
            [Satellite, 'Geo verification', 'Evidence is captured in-app with GPS coordinates and burned-in timestamps. No gallery uploads.'],
            [History, 'Audit trail', 'Every status change records who acted, when, and with what evidence.'],
            [Lock, 'Private documents', 'Municipal authorization documents are used only for verification and are never shown publicly.'],
          ].map(([I, title, text]) => {
            const Icon = I as typeof Lock;
            return (
              <div key={title as string} className="card p-5">
                <Icon className="h-5 w-5 text-brand-700" />
                <div className="mt-3 font-bold">{title as string}</div>
                <p className="mt-1 text-sm text-ink-500">{text as string}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
