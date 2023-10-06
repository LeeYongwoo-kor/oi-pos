export default function getPreferredLanguage(
  acceptLanguage: string | undefined
): Locale {
  if (!acceptLanguage) {
    return "en";
  }

  const languages = acceptLanguage.split(",").map((lang) => {
    const [language, q = "1"] = lang.split(";q=");
    return { language, q: parseFloat(q) };
  });

  languages.sort((a, b) => b.q - a.q);

  for (const { language } of languages) {
    if (language.startsWith("ja")) {
      return "ja";
    }
    if (language.startsWith("en")) {
      return "en";
    }
  }

  return "en";
}
