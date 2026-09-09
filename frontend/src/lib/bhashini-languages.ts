// Bhashini-supported language set for the UdyogSaarthi language selector.
//
// Source: Digital India BHASHINI — National Language Translation Mission covers
// all 22 Eighth-Schedule languages (+ English as the bridge/interface language).
// Refs: https://bhashini.gov.in/about-bhashini ·
// https://www.pib.gov.in/PressReleasePage.aspx?PRID=2182427 ("22 Languages,
// Digitally Reimagined") · Bhashini API docs follow ISO-639 language codes
// (https://bhashini.gitbook.io/bhashini-apis). Codes below are ISO-639-1 where
// one exists, otherwise ISO-639-2/3 (brx, doi, kok, mai, mni, sat).
//
// Translation wiring is out of scope — this file is the selector's data only.

export interface BhashiniLanguage {
  /** ISO-639 language code (matches Bhashini API language codes). */
  code: string;
  /** English display name. */
  label: string;
  /** Autonym (language name in its own script). */
  nativeLabel: string;
}

export const BHASHINI_LANGUAGES: BhashiniLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'brx', label: 'Bodo', nativeLabel: "बर'" },
  { code: 'doi', label: 'Dogri', nativeLabel: 'डोगरी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ks', label: 'Kashmiri', nativeLabel: 'کٲشُر' },
  { code: 'kok', label: 'Konkani', nativeLabel: 'कोंकणी' },
  { code: 'mai', label: 'Maithili', nativeLabel: 'मैथिली' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'mni', label: 'Manipuri', nativeLabel: 'মণিপুরী' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'sa', label: 'Sanskrit', nativeLabel: 'संस्कृतम्' },
  { code: 'sat', label: 'Santali', nativeLabel: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', label: 'Sindhi', nativeLabel: 'سنڌي' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
];

export const DEFAULT_LANGUAGE_CODE = 'en';

export const SAARTHI_LANG_STORAGE_KEY = 'saarthi-lang';
