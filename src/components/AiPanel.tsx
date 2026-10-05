import { ScanSearch, Layers, Radar, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { AiAnalysis, Priority } from '../lib/types';
import { useT } from '../i18n';
import { PriorityBadge } from './badges';
import { DemoTag } from './ui';

export function AiPanel({ ai, priority, dark, compact, showPriority = true }: { ai: AiAnalysis; priority: Priority; dark?: boolean; compact?: boolean; showPriority?: boolean }) {
  const t = useT();
  const box = clsx('rounded-2xl p-4', dark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-ink-50/80 ring-1 ring-ink-100');
  const k = clsx('text-[11px] uppercase tracking-wider', dark ? 'text-ink-400' : 'text-ink-500');
  const v = clsx('font-bold', dark ? 'text-white' : 'text-ink-900');
  const head = (Icon: typeof Radar, label: string) => (
    <div className={clsx('mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider', dark ? 'text-brand-300' : 'text-brand-700')}>
      <Icon className="h-4 w-4" /> {label}
    </div>
  );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className={clsx('text-sm font-bold', dark ? 'text-white' : 'text-ink-900')}>CivicSense Intelligence</div>
        <DemoTag label="Simulated AI values" />
      </div>
      <div className={clsx('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
        <div className={box}>
          {head(ScanSearch, t('rp.imageAnalysis'))}
          <div className="flex justify-between text-sm"><span className={k}>{t('rp.garbageDetected')}</span><span className={clsx(v, 'text-emerald-600')}>{ai.garbageDetected ? t('rp.yes') : t('rp.no')}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span className={k}>{t('rp.severity')}</span><span className={clsx(v, 'uppercase')}>{t(`priority.${ai.imageSeverity}`)}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span className={k}>{t('rp.confidence')}</span><span className={v}>{Math.round(ai.confidence * 100)}% <span className="text-[10px] font-semibold text-amber-600">(sim.)</span></span></div>
        </div>
        <div className={box}>
          {head(Layers, t('rp.duplicateCheck'))}
          <div className="flex justify-between text-sm"><span className={k}>{t('rp.nearbySimilar')}</span><span className={v}>{ai.duplicates.length}</span></div>
          {ai.duplicates.length > 0 && <div className={clsx('mono mt-1 truncate text-[11px]', dark ? 'text-ink-400' : 'text-ink-500')}>{ai.duplicates.slice(0, 3).join(' · ')}</div>}
          {showPriority && (<div className="mt-1 flex justify-between text-sm"><span className={k}>{t('rp.locationSensitivity')}</span><span className={v}>{Math.round(ai.locationSensitivity * 100)}/100</span></div>)}
        </div>
        <div className={box}>
          {head(Radar, t('rp.hotspotAnalysis'))}
          <div className="flex justify-between text-sm"><span className={k}>{t('rp.repeatOccurrence')}</span><span className={clsx(v, ai.repeatArea ? 'text-red-600' : '')}>{ai.repeatArea ? t('rp.yes') : t('rp.no')}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span className={k}>Incidents within 150 m (45 d)</span><span className={v}>{ai.nearbyHistory}</span></div>
        </div>
        {showPriority && (
        <div className={box}>
          {head(Sparkles, t('common.priority'))}
          <div className="flex items-center justify-between">
            <PriorityBadge priority={priority} className="!text-xs" />
            <span className={clsx('text-sm', v)}>{ai.score}/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200/60">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600" style={{ width: `${ai.score}%` }} />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
