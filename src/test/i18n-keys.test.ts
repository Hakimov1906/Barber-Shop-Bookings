import { describe, expect, it } from "vitest";
import { enDictionary } from "@/lib/i18n/dictionaries/en";
import { ruDictionary } from "@/lib/i18n/dictionaries/ru";
import { kgDictionary } from "@/lib/i18n/dictionaries/kg";

function sortedKeys(input: Record<string, string>) {
  return Object.keys(input).sort();
}

describe("i18n dictionaries", () => {
  it("should keep the same keyset across all languages", () => {
    const enKeys = sortedKeys(enDictionary);
    const ruKeys = sortedKeys(ruDictionary);
    const kgKeys = sortedKeys(kgDictionary);

    expect(ruKeys).toEqual(enKeys);
    expect(kgKeys).toEqual(enKeys);
  });

  it("should contain normalized readable strings for core keys", () => {
    expect(ruDictionary["nav.home"]).toBe("Главная");
    expect(kgDictionary["nav.home"]).toBe("Башкы бет");
    expect(ruDictionary["auth.field.fullName"]).toBe("Имя и фамилия");
    expect(kgDictionary["common.years"]).toBe("жыл");
  });
});
