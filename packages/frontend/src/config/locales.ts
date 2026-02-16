import * as SecureStore from "expo-secure-store";

// ── Supported locales ──────────────────────────────────────────────
export interface LocaleOption {
  code: string;
  /** Native name (displayed in the picker) */
  label: string;
  /** English name (for accessibility / fallback) */
  englishName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", label: "English", englishName: "English", flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { code: "es", label: "Espa\u00f1ol", englishName: "Spanish", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  { code: "fr", label: "Fran\u00e7ais", englishName: "French", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { code: "de", label: "Deutsch", englishName: "German", flag: "\uD83C\uDDE9\uD83C\uDDEA" },
  { code: "it", label: "Italiano", englishName: "Italian", flag: "\uD83C\uDDEE\uD83C\uDDF9" },
  { code: "pt", label: "Portugu\u00eas", englishName: "Portuguese", flag: "\uD83C\uDDE7\uD83C\uDDF7" },
  { code: "ja", label: "\u65E5\u672C\u8A9E", englishName: "Japanese", flag: "\uD83C\uDDEF\uD83C\uDDF5" },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4", englishName: "Korean", flag: "\uD83C\uDDF0\uD83C\uDDF7" },
  { code: "zh", label: "\u4E2D\u6587", englishName: "Chinese", flag: "\uD83C\uDDE8\uD83C\uDDF3" },
  { code: "fa", label: "\u0641\u0627\u0631\u0633\u06CC", englishName: "Farsi", flag: "\uD83C\uDDEE\uD83C\uDDF7" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", englishName: "Arabic", flag: "\uD83C\uDDF8\uD83C\uDDE6" },
];

export const DEFAULT_LOCALE = "en";

const LOCALE_STORAGE_KEY = "user_locale";

// ── Persistence (expo-secure-store) ────────────────────────────────

export async function loadSavedLocale(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch {
    // Storage unavailable — fall through
  }
  return DEFAULT_LOCALE;
}

export async function saveLocale(code: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, code);
  } catch {
    // Best-effort — non-critical
  }
}

export function getLocaleOption(code: string): LocaleOption {
  return (
    SUPPORTED_LOCALES.find((l) => l.code === code) ?? SUPPORTED_LOCALES[0]
  );
}

