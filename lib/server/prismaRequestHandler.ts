import { Prisma } from "@prisma/client";
import prismaErrorHandler from "./prismaErrorHandler";

export default async function prismaRequestHandler<T>(
  promise: Prisma.PrismaPromise<T>,
  functionName: string
): Promise<T> {
  try {
    const data = await promise;
    return data;
  } catch (e: any) {
    console.error(`Error in ${functionName}: ${e.message}`, e);
    prismaErrorHandler(e); // This will throw a custom error
  }
}
