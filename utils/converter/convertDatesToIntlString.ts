interface ConvertDatesToIntlStringOptions {
  hideSecond?: boolean;
  onlyTime?: boolean;
}

export default function convertDatesToIntlString(
  date: Date,
  options?: ConvertDatesToIntlStringOptions
): string | null {
  if (!date || new Date(date).toString() === "Invalid Date") {
    // Send error to Sentry
    console.error(`convertDatesToIntl: ${date} is not a Date object`);
    return null;
  }

  const intlOption: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
  };

  if (!options?.hideSecond) {
    intlOption.second = "numeric";
  }

  if (!options?.onlyTime) {
    intlOption.month = "numeric";
    intlOption.day = "numeric";
  }

  const intl = new Intl.DateTimeFormat("en-US", intlOption);
  return intl.format(new Date(date));
}
