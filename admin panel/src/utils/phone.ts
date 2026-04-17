export const KYRGYZ_PHONE_PREFIX = "+996";
export const KYRGYZ_PHONE_TOTAL_LENGTH = 13;
const KYRGYZ_LOCAL_DIGITS = 9;

function extractLocalDigits(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  let local = digits.startsWith("996") ? digits.slice(3) : digits;

  // Handle pasted numbers like "+996+996XXXXXXXXX" where prefix is duplicated.
  while (local.length > KYRGYZ_LOCAL_DIGITS && local.startsWith("996")) {
    local = local.slice(3);
  }

  // Handle common local entry "0XXXXXXXXX" (drop trunk zero).
  if (local.length > KYRGYZ_LOCAL_DIGITS && local.startsWith("0")) {
    local = local.slice(1);
  }

  return local.slice(0, KYRGYZ_LOCAL_DIGITS);
}

export function normalizeKyrgyzPhone(value: string) {
  const local = extractLocalDigits(value);
  return `${KYRGYZ_PHONE_PREFIX}${local}`;
}

export function ensureKyrgyzPhonePrefix(value: string) {
  if (!value) return KYRGYZ_PHONE_PREFIX;
  return normalizeKyrgyzPhone(value);
}

export function isValidKyrgyzPhone(value: string) {
  return /^\+996\d{9}$/.test(String(value || "").trim());
}

