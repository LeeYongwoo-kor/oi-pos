import isPositiveInteger from "../validation/isPositiveInteger";

export default function convertOrderNumberToNumber(
  orderNumber: string
): number {
  if (!orderNumber || typeof orderNumber !== "string") {
    // Send error to Sentry
    console.error(
      `convertOrderNumberToNumber: ${orderNumber} is empty or not a string`
    );
    return 0;
  }

  const formattedOrderNumber = Number(orderNumber.replace("-", ""));
  if (!isPositiveInteger(formattedOrderNumber)) {
    // Send error to Sentry
    console.error(
      `convertOrderNumberToNumber: ${formattedOrderNumber} is not positiveInteger`
    );
    return 0;
  }

  return formattedOrderNumber;
}
