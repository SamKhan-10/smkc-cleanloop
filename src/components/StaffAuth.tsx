import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Upload, FileCheck2, Lock, Loader2, ShieldCheck, Check, BadgeCheck, ArrowLeft, Smartphone, EyeOff, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { StaffAccount, StaffRole, ZoneId } from '../lib/types';
import { useStore } from '../lib/store';
import { ZONES } from '../lib/geo';
import { OtpInput } from './OtpInput';
import { toast } from './Toast';
import { LogoMark } from './Logo';

const DEMO_OTP = '123456';
export const ROLE_LABEL: Record<StaffRole, string> = {
  municipal_officer: 'Municipal Officer',
  ward_officer: 'Ward Officer',
  field_staff: 'Field Staff',
  ground_verifier: 'Ground Verifier',
};
const DEPARTMENTS = ['Solid Waste Management', 'Health & Sanitation', 'Ward Administration', 'Public Works', 'Vigilance & Enforcement'];

export function StaffAuth({ mode }: { mode: 'municipal' | 'verifier' }) {
  const registerStaff = useStore((s) => s.registerStaff);
  const verifyStaff = useStore((s) => s.verifyStaff);
  const loginStaff = useStore((s) => s.loginStaff);
  const [step, setStep] = useState<'form' | 'otp' | 'review' | 'verified'>('form');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    zone: 'C' as ZoneId,
    department: DEPARTMENTS[0],
    role: (mode === 'verifier' ? 'ground_verifier' : 'ward_officer') as StaffRole,
  });
  const [doc, setDoc] = useState<{ name: string; size: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [acc, setAcc] = useState<StaffAccount | null>(null);
  const [checks, setChecks] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const roles: StaffRole[] = mode === 'verifier' ? ['ground_verifier'] : ['municipal_officer', 'ward_officer', 'field_staff'];
  const dark = true;

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid official email';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit mobile number';
    if (!doc) e.doc = 'Upload a supporting municipal document';
    setErrors(e);
    return !Object.keys(e).length;
  };

  useEffect(() => {
    if (step !== 'review') return;
    setChecks(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setChecks(i);
      if (i >= 4) {
        clearInterval(id);
        setTimeout(() => {
          if (acc) verifyStaff(acc.staffId);
          setStep('verified');
        }, 700);
      }
    }, 750);
    return () => clearInterval(id);
  }, [step]); // eslint-disable-line

  const input = 'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20';
  const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-400';

  return (
    <div className={clsx('min-h-screen bg-ink-950 text-white', dark && '')}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(50%_50%_at_20%_0%,rgba(40,156,128,.18),transparent_70%),radial-gradient(40%_40%_at_100%_100%,rgba(37,99,235,.12),transparent_70%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_1.05fr]">
        <div className="hidden lg:block">
          <Link to="/" className="flex items-center gap-3">
            <LogoMark className="h-11 w-11" />
            <div>
              <div className="font-display text-lg font-extrabold">CivicSense</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Sangli · Miraj · Kupwad</div>
            </div>
          </Link>
          <h1 className="mt-10 font-display text-4xl font-extrabold leading-tight">
            {mode === 'verifier' ? (
              <>FIELD VERIFIER<br /><span className="text-brand-300">Independent ground verification.</span></>
            ) : (
              <>SMKC MUNICIPAL<br />COMMAND CENTER</>
            )}
          </h1>
          <p className="mt-4 max-w-md text-ink-300">
            {mode === 'verifier'
              ? 'Capture fresh geo-tagged evidence at each site and confirm resolution before a complaint is closed.'
              : 'Ward map, priority queue, optimized cleanup routes, ground verification and repeat-hotspot investigation — in one place.'}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ink-300">
            {['Role-based access for officers, field staff and verifiers', 'OTP + supporting document verification', 'Citizen identities protected — Citizen IDs only', 'Every action recorded in the audit trail'].map((x) => (
              <li key={x} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-400" /> {x}</li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2"><LogoMark className="h-9 w-9" /><span className="font-display font-extrabold">CivicSense</span></Link>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{mode === 'verifier' ? 'Field Verifier' : 'Command Center'}</span>
          </div>
          <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-6 shadow-pop backdrop-blur sm:p-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300">
              <Lock className="h-3.5 w-3.5" /> {mode === 'verifier' ? 'Ground Verifier Sign-in' : 'Municipal Staff Sign-in'}
            </div>
            <div className="mt-3 flex gap-1.5">
              {['form', 'otp', 'review', 'verified'].map((s, i) => (
                <span key={s} className={clsx('h-1 flex-1 rounded-full', ['form', 'otp', 'review', 'verified'].indexOf(step) >= i ? 'bg-brand-400' : 'bg-white/10')} />
              ))}
            </div>

            {step === 'form' && (
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validate()) return;
                  setBusy(true);
                  setTimeout(() => {
                    setBusy(false);
                    setStep('otp');
                    toast('SMS · CivicSense Staff', `Your staff verification code is ${DEMO_OTP}.`, 'info');
                  }, 800);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={label}>Municipal Staff Name</label>
                    <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name as per staff ID" />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={label}>Official Email</label>
                    <input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@smkc.gov.in" />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <label className={label}>Phone Number</label>
                    <input className={input} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={label}>Ward Selection</label>
                    <select className={input} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as ZoneId })}>
                      {ZONES.map((z) => <option key={z.id} value={z.id} className="bg-ink-900">{z.name} · {z.area}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Department</label>
                    <select className={input} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      {DEPARTMENTS.map((d) => <option key={d} className="bg-ink-900">{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={label}>Role</label>
                  <div className={clsx('grid gap-2', roles.length > 1 ? 'grid-cols-3' : 'grid-cols-1')}>
                    {roles.map((r) => (
                      <button type="button" key={r} onClick={() => setForm({ ...form, role: r })} className={clsx('rounded-xl border px-2 py-2.5 text-xs font-semibold transition', form.role === r ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 text-ink-300 hover:border-white/20')}>
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  {mode === 'municipal' && (
                    <p className="mt-2 text-[11px] text-ink-400">Ground Verifier? <Link to="/verifier" className="font-semibold text-brand-300 hover:underline">Open the Field Verifier app →</Link></p>
                  )}
                </div>
                <div>
                  <label className={label}>Supporting Municipal Document</label>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDoc({ name: f.name, size: f.size });
                  }} />
                  <button type="button" onClick={() => fileRef.current?.click()} className={clsx('flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 text-left transition', doc ? 'border-brand-400/50 bg-brand-500/10' : 'border-white/15 hover:border-white/30')}>
                    {doc ? <FileCheck2 className="h-5 w-5 text-brand-300" /> : <Upload className="h-5 w-5 text-ink-400" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{doc ? doc.name : 'Upload Supporting Document'}</span>
                      <span className="block text-[11px] text-ink-400">{doc ? `${Math.max(1, Math.round(doc.size / 1024))} KB · stored privately` : 'Municipal ID / official authorization · PDF, JPG or PNG'}</span>
                    </span>
                  </button>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400"><EyeOff className="h-3 w-3" /> Used only for staff verification. Never displayed publicly.</p>
                  {errors.doc && <p className="mt-1 text-xs text-red-400">{errors.doc}</p>}
                </div>
                <button type="submit" disabled={busy} className="btn-accent btn-lg w-full">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />} Send OTP
                </button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-semibold text-brand-300 hover:underline"
                  onClick={() => {
                    setForm({
                      ...form,
                      name: mode === 'verifier' ? 'Demo Verifier' : 'Demo Ward Officer',
                      email: mode === 'verifier' ? 'verifier.demo@smkc.gov.in' : 'wardofficer.demo@smkc.gov.in',
                      phone: mode === 'verifier' ? '9800020026' : '9800010026',
                    });
                    setDoc({ name: mode === 'verifier' ? 'GV_Authorization_Demo.pdf' : 'SMKC_Staff_ID_Demo.pdf', size: 184320 });
                  }}
                >
                  Use demo staff details
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="font-display text-xl font-bold">OTP Verification</div>
                  <p className="mt-1 text-sm text-ink-400">Enter the 6-digit code sent to +91 ••••••{form.phone.slice(-4)} and {form.email}</p>
                </div>
                <OtpInput value={otp} onChange={setOtp} error={otpErr} dark />
                {otpErr && <p className="-mt-2 text-xs text-red-400">Incorrect OTP. Please try again.</p>}
                <div className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-300/20">Demo OTP: <b className="mono tracking-widest">{DEMO_OTP}</b></div>
                <button
                  className="btn-accent btn-lg w-full"
                  disabled={otp.length !== 6}
                  onClick={() => {
                    if (otp !== DEMO_OTP) {
                      setOtpErr(true);
                      setTimeout(() => setOtpErr(false), 600);
                      return;
                    }
                    const a = registerStaff({ ...form, phone: form.phone.replace(/\D/g, '').slice(-10), documentName: doc!.name });
                    setAcc(a);
                    if (a.verification === 'verified') setStep('verified');
                    else setStep('review');
                  }}
                >
                  <ShieldCheck className="h-5 w-5" /> Verify
                </button>
                <button className="flex items-center gap-1 text-xs font-semibold text-ink-400 hover:text-white" onClick={() => setStep('form')}><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
              </div>
            )}

            {step === 'review' && (
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30"><Clock className="mr-1 inline h-3 w-3" />Verification Pending</span>
                </div>
                <div className="mt-3 font-display text-xl font-bold">Verifying municipal credentials…</div>
                <ul className="mt-5 space-y-3">
                  {['OTP verified for phone & email', 'Supporting document received (private)', `Ward ${form.zone} office confirmation`, `Role access granted · ${ROLE_LABEL[form.role]}`].map((x, i) => (
                    <li key={x} className={clsx('flex items-center gap-3 text-sm transition', checks > i ? 'text-white' : 'text-ink-500')}>
                      <span className={clsx('grid h-6 w-6 place-items-center rounded-full', checks > i ? 'bg-emerald-500' : 'bg-white/5')}>
                        {checks > i ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : checks === i ? <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-300" /> : null}
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] text-ink-500">Simulated verification for this deployment. In production this step is completed by the SMKC administration.</p>
              </div>
            )}

            {step === 'verified' && acc && (
              <div className="mt-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 animate-pop"><BadgeCheck className="h-9 w-9" /></div>
                <div className="mt-3 inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">Verified</div>
                <div className="mt-3 font-display text-2xl font-bold">{ROLE_LABEL[acc.role]}</div>
                <div className="mono mt-1 text-lg text-brand-300">{acc.staffId}</div>
                <div className="mt-1 text-sm text-ink-400">Ward {acc.zone} · {acc.department}</div>
                <button className="btn-accent btn-lg mt-6 w-full" onClick={() => loginStaff({ ...acc, verification: 'verified' })}>
                  <Building2 className="h-5 w-5" /> {mode === 'verifier' ? 'Open Field Verifier' : 'Enter Command Center'}
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 text-center text-xs text-ink-500">
            <Link to="/" className="hover:text-ink-300">← Back to public site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
