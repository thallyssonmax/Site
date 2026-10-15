import { en, pt } from "./translations.js";

const storageKey = "portfolio-language";
const supportedLocales = new Set(["pt-BR", "en-US"]);
const originals = new WeakMap();
const attributeBindings = {
  "data-i18n-aria-label": "aria-label",
  "data-i18n-aria-roledescription": "aria-roledescription",
  "data-i18n-alt": "alt",
  "data-i18n-content": "content",
  "data-i18n-href": "href",
  "data-i18n-title": "title",
};

function browserLocale() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const preferred = languages.find((language) => /^(pt|en)(-|$)/i.test(language || "")) || "";
  return /^pt/i.test(preferred) ? "pt-BR" : "en-US";
}

function savedLocale() {
  try {
    const value = localStorage.getItem(storageKey);
    return supportedLocales.has(value) ? value : null;
  } catch {
    return null;
  }
}

let locale = supportedLocales.has(window.portfolioLocale)
  ? window.portfolioLocale
  : savedLocale() || browserLocale();

export function t(key, values = {}) {
  const translation = (locale === "en-US" ? en : pt)[key];
  return typeof translation === "function" ? translation(values) : translation || key;
}

function applyTranslations() {
  window.portfolioLocale = locale;
  document.documentElement.lang = locale;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    let original = originals.get(element);
    if (!original) {
      original = { text: element.textContent, attributes: {} };
      originals.set(element, original);
    }
    const translation = en[element.dataset.i18n];
    element.textContent = locale === "en-US" && typeof translation === "string" ? translation : original.text;
  });

  Object.entries(attributeBindings).forEach(([binding, attribute]) => {
    document.querySelectorAll(`[${binding}]`).forEach((element) => {
      let original = originals.get(element);
      if (!original) {
        original = { text: element.textContent, attributes: {} };
        originals.set(element, original);
      }
      if (!(attribute in original.attributes)) original.attributes[attribute] = element.getAttribute(attribute);
      const translation = en[element.getAttribute(binding)];
      const value = locale === "en-US" && typeof translation === "string"
        ? translation
        : original.attributes[attribute];
      if (value === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, value);
    });
  });

  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.locale === locale));
  });

  document.documentElement.removeAttribute("data-i18n-pending");
  window.dispatchEvent(new CustomEvent("localechange", { detail: { locale } }));
}

export function setLocale(nextLocale) {
  if (!supportedLocales.has(nextLocale)) return;
  locale = nextLocale;
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // The manual choice still applies for the current page if storage is disabled.
  }
  applyTranslations();
}

export function initI18n() {
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => setLocale(button.dataset.locale));
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    locale = savedLocale() || browserLocale();
    applyTranslations();
  });
  applyTranslations();
}
