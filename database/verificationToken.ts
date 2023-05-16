import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";

export async function deleteVerificationTokens(
  identifier: string | null | undefined
): Promise<{ count: number } | null> {
  if (!identifier) {
    return null;
  }

  const [deleteCount, error] = await prismaRequestHandler(
    prisma.verificationToken.deleteMany({
      where: { identifier },
    }),
    "deleteVerificationTokens"
  );

  if (error) {
    throw new Error(error.message);
  }

  return deleteCount;
}
