import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import prismaRequestHandler from "./prismaRequestHandler";

export async function prismaRequestWithDateConversionForGet<T>(
  prismaPromise: Promise<T>,
  debugInfo: string
): Promise<T | null> {
  const result = await prismaRequestHandler(prismaPromise, debugInfo);
  return result ? convertDatesToISOString(result) : null;
}
