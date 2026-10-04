import { useCallback } from 'react';
import { useStore, type Lang } from '../lib/store';
import { en, hi, mr } from './strings';

const DICTS: Record<Lang, Record<string, string>> = { en, mr, hi };

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'mr', label: 'मराठी', short: 'मरा' },
  { id: 'hi', label: 'हिंदी', short: 'हिं' },
];

export function translate(lang: Lang, key: string, params?: Record<string, string | number>) {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
}
