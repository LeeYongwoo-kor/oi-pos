export default function convertDatesToIntlString(
  date: Date,
  hiddenSecond = false
): string | null {
  if (!date || new Date(date).toString() === "Invalid Date") {
    // Send error to Sentry
    console.error(`convertDatesToIntl: ${date} is not a Date object`);
    return null;
  }

  const intlOption: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  if (!hiddenSecond) {
    intlOption.second = "numeric";
  }

  const intl = new Intl.DateTimeFormat("en-US", intlOption);
  return intl.format(new Date(date));
}
