import { Injectable, computed, signal } from '@angular/core';

import { EN } from './en';
import { ES, ES_LITERALS } from './es';

export type Lang = 'en' | 'es';

export const LANGUAGES: { value: Lang; label: string; name: string }[] = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'es', label: 'ES', name: 'Español' },
];

const STORAGE_KEY = 'fraudshield.lang';
const LOCALES: Record<Lang, string> = { en: 'en-US', es: 'es-ES' };

type Dict = { [key: string]: string | Dict };

let activeLang: Lang = 'en';

const ES_LOWER = new Map(Object.entries(ES_LITERALS).map(([en, es]) => [en.toLowerCase(), es]));

/** BCP-47 locale of the active language, for Intl formatting outside Angular DI. */
export function activeLocale(): string {
  return LOCALES[activeLang];
}

/**
 * UI language. English is the default; the choice persists per browser.
 * Reading `lang()` inside templates, computed() or t() makes them follow a switch.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readStored());
  readonly locale = computed(() => LOCALES[this.lang()]);

  constructor() {
    this.apply(this.lang());
  }

  set(lang: Lang): void {
    if (lang === this.lang()) return;
    this.lang.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable: the choice lasts for this session */
    }
  }

  /** Translate a dotted key ("dashboard.title"), interpolating {placeholders}. */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.lang();
    const text = lookup(lang === 'es' ? ES : EN, key) ?? lookup(EN, key) ?? key;
    return params ? interpolate(text, params) : text;
  }

  /** Translate a data literal (status codes, sample-data labels); unknown text passes through. */
  lit(text: string | null | undefined): string {
    if (text === null || text === undefined) return '';
    if (this.lang() === 'en') return text;
    const exact = ES_LITERALS[text] ?? ES_LITERALS[text.toUpperCase()];
    if (exact) return exact;
    // Compound alert reasons: "New device · unusual location".
    if (text.includes(' · ')) {
      const joined = text
        .split(' · ')
        .map((part) => ES_LOWER.get(part.toLowerCase())?.toLowerCase() ?? part)
        .join(' · ');
      return joined.charAt(0).toUpperCase() + joined.slice(1);
    }
    return ES_LOWER.get(text.toLowerCase()) ?? text;
  }

  private apply(lang: Lang): void {
    activeLang = lang;
    document.documentElement.lang = lang;
  }

  private readStored(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {
      /* fall through to the default */
    }
    return 'en';
  }
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
