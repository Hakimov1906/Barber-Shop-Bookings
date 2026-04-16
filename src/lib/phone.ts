export const KG_PHONE_PREFIX = "+996";
export const KG_PHONE_DIGITS = 9;
export const KG_PHONE_TOTAL_LENGTH = KG_PHONE_PREFIX.length + KG_PHONE_DIGITS;
const KG_PHONE_REGEX = /^\+996\d{9}$/;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeKgPhoneInput(value: string) {
  const digits = normalizeDigits(value);
  const withoutCountry = digits.startsWith("996") ? digits.slice(3) : digits;
  return `${KG_PHONE_PREFIX}${withoutCountry.slice(0, KG_PHONE_DIGITS)}`;
}

export function isValidKgPhone(value: string) {
  return KG_PHONE_REGEX.test(value);
}

export function getKgPhoneInputStart() {
  return KG_PHONE_PREFIX;
}
