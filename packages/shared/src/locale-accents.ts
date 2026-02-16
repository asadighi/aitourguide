/**
 * Locale-specific accent and dialect configuration.
 *
 * These hints are injected into the guide_generate prompt so the LLM writes
 * narration text in the correct regional dialect. Since OpenAI TTS infers
 * accent from the text itself, using the right regional vocabulary and
 * phrasing is the primary lever for authentic-sounding narration.
 *
 * For non-English locales, `preferredModel` defaults to "tts-1-hd" which
 * produces significantly higher quality pronunciation. Locales can also
 * provide `ttsInstructions` for models that support it (e.g. gpt-4o-mini-tts).
 */

export interface LocaleAccentConfig {
  /** ISO 639-1 language code */
  code: string;
  /** Full language name in English */
  language: string;
  /** Country/region the accent is anchored to */
  region: string;
  /**
   * Dialect instruction injected into the guide_generate prompt.
   * Tells the LLM exactly which regional style to use for narration.
   */
  dialectHint: string;
  /**
   * Preferred OpenAI TTS voice for this locale.
   * Some voices handle certain languages/scripts better.
   * Voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
   */
  preferredVoice: string;
  /**
   * Preferred TTS model for this locale.
   * "tts-1" (fast), "tts-1-hd" (higher quality, better for non-English),
   * or "gpt-4o-mini-tts" (best quality, supports instructions).
   * Falls back to env TTS_MODEL → "tts-1" if not set.
   */
  preferredModel?: string;
  /**
   * TTS-level instructions for accent/style control.
   * Only used with models that support instructions (e.g. gpt-4o-mini-tts).
   * Guides the TTS engine on pronunciation, accent, and delivery style.
   */
  ttsInstructions?: string;
}

export const LOCALE_ACCENT_MAP: Record<string, LocaleAccentConfig> = {
  en: {
    code: "en",
    language: "English",
    region: "United States",
    dialectHint:
      "Write in standard American English with a warm, conversational tone typical of a professional tour guide in the US.",
    preferredVoice: "nova",
  },
  es: {
    code: "es",
    language: "Spanish",
    region: "Spain",
    dialectHint:
      "Write in Castilian Spanish (español de España) as spoken in Madrid. Use vosotros conjugation, and European Spanish vocabulary and expressions — not Latin American variants.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  fr: {
    code: "fr",
    language: "French",
    region: "France",
    dialectHint:
      "Write in standard metropolitan French (français de France) as spoken in Paris. Use Parisian vocabulary and phrasing — not Canadian, Belgian, or African French variants.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  de: {
    code: "de",
    language: "German",
    region: "Germany",
    dialectHint:
      "Write in standard High German (Hochdeutsch) as spoken in Berlin or Hamburg. Use modern, conversational German — not Austrian or Swiss German variants.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  it: {
    code: "it",
    language: "Italian",
    region: "Italy",
    dialectHint:
      "Write in standard Italian as spoken in Rome or Florence. Use modern, conversational Italian with proper grammar — avoid regional dialects like Neapolitan or Sicilian.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  pt: {
    code: "pt",
    language: "Portuguese",
    region: "Brazil",
    dialectHint:
      "Write in Brazilian Portuguese (português brasileiro) as spoken in São Paulo or Rio de Janeiro. Use Brazilian vocabulary, grammar, and expressions — not European Portuguese.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  ja: {
    code: "ja",
    language: "Japanese",
    region: "Japan",
    dialectHint:
      "Write in standard Japanese (標準語/hyōjungo) as spoken in Tokyo. Use polite but approachable register (丁寧語/teineigo). Avoid regional dialects like Kansai-ben.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  ko: {
    code: "ko",
    language: "Korean",
    region: "South Korea",
    dialectHint:
      "Write in standard South Korean (표준어/pyojuneo) as spoken in Seoul. Use polite register (해요체/haeyoche). Avoid North Korean vocabulary or regional dialects.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  zh: {
    code: "zh",
    language: "Chinese",
    region: "China",
    dialectHint:
      "Write in standard Mandarin Chinese (普通话/Pǔtōnghuà) as spoken in Beijing. Use simplified Chinese characters. Avoid Cantonese, Taiwanese Mandarin variants, or regional expressions.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
  fa: {
    code: "fa",
    language: "Farsi",
    region: "Iran",
    dialectHint:
      "Write in modern conversational Persian (فارسی) as spoken today in Tehran, Iran. Use contemporary Tehran dialect vocabulary and expressions. Do NOT use Afghan Dari or Tajik variants. Use the colloquial Tehran accent phrasing — for example use 'می‌خوام' style contractions typical of spoken Tehrani Persian rather than formal written style. The narration should sound like a local Tehrani tour guide speaking naturally. IMPORTANT PHONOLOGICAL MARKERS for Iranian Persian (NOT Afghan): use 'آ' (ā) sounds where Afghans use 'ا' (a), write 'است' as colloquial 'ـه' (e), use the ezafe 'ـِ' construction naturally, prefer 'خیلی' over 'بسیار' in casual speech, say 'الان' (alān) not 'حالا' (hālā) for 'now', use 'چطوری' not 'چطور استی'. Write numbers and dates in the Iranian format.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
    ttsInstructions:
      "Speak in standard Iranian Persian (Farsi) with a Tehran accent. Use Iranian pronunciation patterns — NOT Afghan Dari or Tajik. Pronounce words the way an educated Tehrani speaker would. For example: pronounce 'و' as 'o' (not 'wa'), 'را' as 'ro' (not 'rā'), and soften consonants in the typical Tehran style. Speak warmly, like a knowledgeable local tour guide.",
  },
  ar: {
    code: "ar",
    language: "Arabic",
    region: "Saudi Arabia",
    dialectHint:
      "Write in Modern Standard Arabic (العربية الفصحى / al-fuṣḥā) but with a conversational, accessible tone. Where colloquial expressions are needed for warmth, lean toward Gulf Arabic (خليجي) as spoken in Riyadh. Avoid Egyptian, Levantine, or Maghreb dialect-specific words.",
    preferredVoice: "nova",
    preferredModel: "tts-1-hd",
  },
};

/**
 * Get the accent config for a locale code.
 * Falls back to English if the locale is not found.
 */
export function getLocaleAccent(code: string): LocaleAccentConfig {
  return LOCALE_ACCENT_MAP[code] ?? LOCALE_ACCENT_MAP["en"];
}

