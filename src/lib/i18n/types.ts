import type { enDictionary } from "@/lib/i18n/dictionaries/en";

export type I18nKey = keyof typeof enDictionary;
export type I18nDictionary = Record<I18nKey, string>;
