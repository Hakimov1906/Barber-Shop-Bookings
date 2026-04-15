import { describe, expect, it } from "vitest";
import { enDictionary } from "@/lib/i18n/dictionaries/en";
import { ruDictionary } from "@/lib/i18n/dictionaries/ru";
import { kyDictionary } from "@/lib/i18n/dictionaries/ky";

function sortedKeys(input: Record<string, string>) {
  return Object.keys(input).sort();
}

describe("i18n dictionaries", () => {
  it("should keep the same keyset across all languages", () => {
    const enKeys = sortedKeys(enDictionary);
    const ruKeys = sortedKeys(ruDictionary);
    const kyKeys = sortedKeys(kyDictionary);

    expect(ruKeys).toEqual(enKeys);
    expect(kyKeys).toEqual(enKeys);
  });

  it("should keep key values non-empty for core keys", () => {
    expect(ruDictionary["nav.home"].trim().length).toBeGreaterThan(0);
    expect(kyDictionary["nav.home"].trim().length).toBeGreaterThan(0);
    expect(ruDictionary["auth.field.fullName"].trim().length).toBeGreaterThan(0);
    expect(kyDictionary["common.years"].trim().length).toBeGreaterThan(0);
    expect(enDictionary["profile.settings.password.title"].trim().length).toBeGreaterThan(0);
    expect(ruDictionary["profile.settings.password.title"].trim().length).toBeGreaterThan(0);
    expect(kyDictionary["profile.settings.password.title"].trim().length).toBeGreaterThan(0);
  });
});
