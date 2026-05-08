export type PhoneCountry =
  | "kg"
  | "kz"
  | "ru"
  | "uz"
  | "tj"
  | "az"
  | "am"
  | "ge"
  | "tr"
  | "ae"
  | "us";

export type PhoneCountryConfig = {
  code: PhoneCountry;
  name: string;
  prefix: string;
  localDigits: number;
  placeholder: string;
};

export const PHONE_COUNTRIES: PhoneCountryConfig[] = [
  {
    code: "kg",
    name: "Кыргызстан",
    prefix: "+996",
    localDigits: 9,
    placeholder: "+996000000000",
  },
  {
    code: "kz",
    name: "Казахстан",
    prefix: "+7",
    localDigits: 10,
    placeholder: "+70000000000",
  },
  {
    code: "ru",
    name: "Россия",
    prefix: "+7",
    localDigits: 10,
    placeholder: "+70000000000",
  },
  {
    code: "uz",
    name: "Узбекистан",
    prefix: "+998",
    localDigits: 9,
    placeholder: "+998000000000",
  },
  {
    code: "tj",
    name: "Таджикистан",
    prefix: "+992",
    localDigits: 9,
    placeholder: "+992000000000",
  },
  {
    code: "az",
    name: "Азербайджан",
    prefix: "+994",
    localDigits: 9,
    placeholder: "+994000000000",
  },
  {
    code: "am",
    name: "Армения",
    prefix: "+374",
    localDigits: 8,
    placeholder: "+37400000000",
  },
  {
    code: "ge",
    name: "Грузия",
    prefix: "+995",
    localDigits: 9,
    placeholder: "+995000000000",
  },
  {
    code: "tr",
    name: "Турция",
    prefix: "+90",
    localDigits: 10,
    placeholder: "+900000000000",
  },
  {
    code: "ae",
    name: "ОАЭ",
    prefix: "+971",
    localDigits: 9,
    placeholder: "+971000000000",
  },
  {
    code: "us",
    name: "США",
    prefix: "+1",
    localDigits: 10,
    placeholder: "+10000000000",
  },
];

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = "kg";

export const KG_PHONE_PREFIX = "+996";
export const KG_PHONE_DIGITS = 9;
export const KG_PHONE_TOTAL_LENGTH = KG_PHONE_PREFIX.length + KG_PHONE_DIGITS;

const PHONE_REGEX = /^(\+996\d{9}|\+7\d{10}|\+998\d{9}|\+992\d{9}|\+994\d{9}|\+374\d{8}|\+995\d{9}|\+90\d{10}|\+971\d{9}|\+1\d{10})$/;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getPhoneCountryConfig(country: PhoneCountry) {
  return PHONE_COUNTRIES.find((item) => item.code === country) || PHONE_COUNTRIES[0];
}

export function getPhonePrefix(country: PhoneCountry) {
  return getPhoneCountryConfig(country).prefix;
}

export function getPhoneMaxLength(country: PhoneCountry) {
  const config = getPhoneCountryConfig(country);
  return config.prefix.length + config.localDigits;
}

export function getPhonePlaceholder(country: PhoneCountry) {
  return getPhoneCountryConfig(country).placeholder;
}

export function getPhonePattern(country: PhoneCountry) {
  const config = getPhoneCountryConfig(country);
  return `^\\${config.prefix}\\d{${config.localDigits}}$`;
}

export function detectPhoneCountry(value: string): PhoneCountry {
  const digits = normalizeDigits(value);
  const detected = PHONE_COUNTRIES.find((country) => {
    const countryDigits = country.prefix.replace(/\D/g, "");
    return digits.startsWith(countryDigits);
  });

  if (detected) {
    return detected.code;
  }
  return "kg";
}

export function normalizePhoneInput(value: string, country: PhoneCountry) {
  const config = getPhoneCountryConfig(country);
  const countryDigits = config.prefix.replace(/\D/g, "");
  const digits = normalizeDigits(value);
  const withoutCountry = digits.startsWith(countryDigits)
    ? digits.slice(countryDigits.length)
    : digits;

  return `${config.prefix}${withoutCountry.slice(0, config.localDigits)}`;
}

export function isValidPhoneNumber(value: string) {
  return PHONE_REGEX.test(value);
}

export function normalizeKgPhoneInput(value: string) {
  return normalizePhoneInput(value, "kg");
}

export function isValidKgPhone(value: string) {
  return /^\+996\d{9}$/.test(value);
}

export function getKgPhoneInputStart() {
  return KG_PHONE_PREFIX;
}
