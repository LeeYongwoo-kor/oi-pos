export default function convertNumberToOrderNumber(
  number: number
): string | "Request failed" {
  if (number === null || number === undefined || typeof number !== "number") {
    // Send error to Sentry
    console.error(
      `convertNumberToOrderNumber: ${number} is empty or not a number`
    );
    return "Request failed";
  }

  const formattedNumber = String(number).padStart(8, "0");
  return `${formattedNumber.substring(0, 4)}-${formattedNumber.substring(4)}`;
}
