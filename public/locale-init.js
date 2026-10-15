(() => {
  let saved;
  try {
    saved = localStorage.getItem("portfolio-language");
  } catch {
    saved = null;
  }

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const preferred = languages.find((language) => /^(pt|en)(-|$)/i.test(language || "")) || "";
  const locale = saved === "pt-BR" || saved === "en-US"
    ? saved
    : /^pt/i.test(preferred) ? "pt-BR" : "en-US";

  window.portfolioLocale = locale;
  document.documentElement.lang = locale;
  if (locale === "en-US") {
    document.documentElement.setAttribute("data-i18n-pending", "");
    window.setTimeout(() => {
      if (!document.documentElement.hasAttribute("data-i18n-pending")) return;
      document.documentElement.lang = "pt-BR";
      document.documentElement.removeAttribute("data-i18n-pending");
    }, 3000);
  }
})();
