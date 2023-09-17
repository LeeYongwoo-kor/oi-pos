import { CurrencyType } from "@prisma/client";

export default function getCurrency(price: number, currency?: Currency) {
  if (typeof price !== "number" || isNaN(price)) {
    return price;
  }

  const currencyType = currency === CurrencyType.JPY ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(currencyType, {
    style: "currency",
    currency: currency ?? CurrencyType.USD,
  }).format(price);
}
