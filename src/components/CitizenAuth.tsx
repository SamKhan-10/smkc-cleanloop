import { useState, type ReactNode } from 'react';
import { ShieldCheck, Smartphone, Mail, UserRound, Loader2, BadgeCheck, Lock, ArrowLeft } from 'lucide-react';
import { useT } from '../i18n';
import { useCitizen, useStore } from '../lib/store';
import { DEMO_CITIZEN } from '../lib/seed';
import { OtpInput } from './OtpInput';
import { toast } from './Toast';

const DEMO_OTP = '123456';

export function CitizenAuth({ onDone, context }: { onDone?: () => void; context?: ReactNode }) {
  const t = useT();
  const register = useStore((s) => s.registerCitizen);
  const login = useStore((s) => s.loginCitizen);
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [citizenId, setCitizenId] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const sendOtp = () => {
    if (!validate()) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStep('otp');
      toast('SMS · CivicSense', `Your CivicSense verification code is ${DEMO_OTP}. Valid for 10 minutes.`, 'info');
    }, 900);
  };

  const verify = () => {
    if (otp !== DEMO_OTP) {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 600);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const acc = register({ ...form, phone: form.phone.replace(/\D/g, '').slice(-10) });
      setCitizenId(acc.citizenId);
      setBusy(false);
      setStep('done');
    }, 800);
  };

  const phoneMasked = `+91 ••••••${form.phone.replace(/\D/g, '').slice(-4)}`;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-200">
            <Lock className="h-3.5 w-3.5" /> Secure Citizen Sign-in
          </div>
          <h2 className="mt-1 text-xl font-bold">{step === 'done' ? t('auth.created') : step === 'otp' ? t('auth.otpTitle') : t('auth.createTitle')}</h2>
          {step === 'form' && <p className="mt-1 text-sm text-brand-100/90">{t('auth.createSub')}</p>}
          {context && step === 'form' && <div className="mt-3">{context}</div>}
          <div className="mt-4 flex gap-1.5">
            {['form', 'otp', 'done'].map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${['form', 'otp', 'done'].indexOf(step) >= i ? 'bg-brand-300' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendOtp();
              }}
              className="space-y-4"
            >
              {(
                [
                  ['name', t('auth.name'), UserRound, 'text', 'e.g. Aarti Patil'],
                  ['email', t('auth.email'), Mail, 'email', 'name@gmail.com'],
                  ['phone', t('auth.phone'), Smartphone, 'tel', '98XXXXXXXX'],
                ] as const
              ).map(([k, label, Icon, type, ph]) => (
                <div key={k}>
                  <label className="label" htmlFor={`ca-${k}`}>{label}</label>
                  <div className="relative">
                    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      id={`ca-${k}`}
                      type={type}
                      className="input pl-9"
                      placeholder={ph}
                      value={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    />
                  </div>
                  {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
                </div>
              ))}
              <button type="submit" className="btn-primary btn-lg w-full" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
                {t('auth.sendOtp')}
              </button>
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-brand-700 hover:underline"
                onClick={() => setForm({ name: DEMO_CITIZEN.name, email: DEMO_CITIZEN.email, phone: DEMO_CITIZEN.phone })}
              >
                {t('auth.fillDemo')}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <p className="text-sm text-ink-600">
                {t('auth.otpSent')} <b className="text-ink-900">{phoneMasked}</b> & <b className="text-ink-900">{form.email}</b>
              </p>
              <OtpInput value={otp} onChange={setOtp} error={otpError} />
              {otpError && <p className="-mt-2 text-xs text-red-600">{t('auth.invalidOtp')}</p>}
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                {t('auth.demoOtp')}: <b className="mono tracking-widest">{DEMO_OTP}</b>
              </div>
              <button className="btn-primary btn-lg w-full" onClick={verify} disabled={otp.length !== 6 || busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {t('auth.verify')}
              </button>
              <div className="flex justify-between text-xs font-semibold">
                <button className="flex items-center gap-1 text-ink-500 hover:text-ink-800" onClick={() => setStep('form')}>
                  <ArrowLeft className="h-3.5 w-3.5" /> {t('common.back')}
                </button>
                <button className="text-brand-700 hover:underline" onClick={() => toast('SMS · CivicSense', `Your CivicSense verification code is ${DEMO_OTP}.`, 'info')}>
                  {t('auth.resend')}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 animate-pop">
                <BadgeCheck className="h-9 w-9" />
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-500">{t('auth.yourId')}</div>
              <div className="mono mt-1 text-3xl font-bold text-brand-800">{citizenId}</div>
              <p className="mx-auto mt-4 max-w-xs rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-600">
                <ShieldCheck className="mb-1 inline h-4 w-4 text-brand-600" /> {t('auth.privacyNote')}
              </p>
              <button
                className="btn-primary btn-lg mt-5 w-full"
                onClick={() => {
                  login(citizenId);
                  onDone?.();
                }}
              >
                {t('common.continue')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CitizenGate({ children, context }: { children: ReactNode; context?: ReactNode }) {
  const citizen = useCitizen();
  if (citizen) return <>{children}</>;
  return (
    <div className="container-x py-10 sm:py-16">
      <CitizenAuth context={context} />
    </div>
  );
}
