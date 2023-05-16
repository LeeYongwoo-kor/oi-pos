import { Prisma } from "@prisma/client";
import prismaErrorHandler from "./prismaErrorHandler";

type PrismaResult<T> =
  | [T, null]
  | [null, ReturnType<typeof prismaErrorHandler>];

export default async function prismaRequestHandler<T>(
  promise: Prisma.PrismaPromise<T>,
  functionName: string
): Promise<PrismaResult<T>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (e: any) {
    const errorResponse = prismaErrorHandler(e);
    console.error(`Error in ${functionName}: ${errorResponse.message}`, e);
    return [null, errorResponse];
  }
}
