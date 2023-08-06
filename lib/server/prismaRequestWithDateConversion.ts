import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import prismaRequestHandler from "./prismaRequestHandler";

export async function prismaRequestWithDateConversion<
  T extends Record<string, any>
>(prismaPromise: Promise<T>, debugInfo: string): Promise<T> {
  const result = await prismaRequestHandler(prismaPromise, debugInfo);
  return convertDatesToISOString(result);
}
