import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";

export async function deleteVerificationTokens(
  identifier: string | null | undefined
): Promise<{ count: number } | null> {
  if (!identifier) {
    return null;
  }

  const deleteCount = await prismaRequestHandler(
    prisma.verificationToken.deleteMany({
      where: { identifier },
    }),
    "deleteVerificationTokens"
  );

  return deleteCount;
}
