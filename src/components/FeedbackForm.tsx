import { useState } from 'react';
import { Send, Heart } from 'lucide-react';
import type { Complaint } from '../lib/types';
import { useT } from '../i18n';
import { useStore } from '../lib/store';
import { Stars } from './ui';
import { toast } from './Toast';

export function FeedbackForm({ c }: { c: Complaint }) {
  const t = useT();
  const submit = useStore((s) => s.submitFeedback);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  if (c.feedback)
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <Heart className="h-4 w-4" /> {t('id.feedbackThanks')}
        </div>
        <div className="mt-2"><Stars value={c.feedback.rating} size="h-5 w-5" /></div>
        {c.feedback.comment && <p className="mt-2 text-sm text-ink-600">“{c.feedback.comment}”</p>}
      </div>
    );
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="font-display text-lg font-bold">{t('id.feedbackTitle')}</div>
      <div className="mt-3"><Stars value={rating} onChange={setRating} size="h-9 w-9" /></div>
      <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('id.feedbackPlaceholder')} className="input mt-3 resize-none" />
      <button
        className="btn-primary mt-3 w-full sm:w-auto"
        disabled={!rating}
        onClick={() => {
          submit(c.id, rating, comment.trim() || undefined);
          toast(t('id.feedbackThanks'), `${c.id} · ${rating}/5`);
        }}
      >
        <Send className="h-4 w-4" /> {t('id.feedbackSubmit')}
      </button>
    </div>
  );
}
