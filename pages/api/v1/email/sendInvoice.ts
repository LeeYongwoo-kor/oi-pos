import { NextApiRequest, NextApiResponse } from "next";
import { generateInvoiceEmail } from "@/email/generateInvoiceEmail";
import { sendEmail } from "@/lib/server/sendEmail";
import withApiHandler from "@/lib/server/withApiHandler";
import { Session } from "@/types/next-auth.types";
import CustomError from "@/utils/CustomError";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  try {
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderData } = req.body;

    const emailContent = generateInvoiceEmail(orderData);
    await sendEmail({
      to: session.user?.email || "",
      from: process.env.EMAIL_FROM!,
      subject: `Hello, ${session.user?.name}! Invoice for your payment`,
      html: emailContent,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to send invoice: ", error);
    const errorIns = error instanceof Error ? error : new Error(String(error));
    throw new CustomError(errorIns.message, errorIns);
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
