import {
  IGenerateInvoiceEmailParams,
  generateInvoiceEmail,
} from "@/email/generateInvoiceEmail";
import withApiHandler from "@/lib/server/withApiHandler";
import { sendEmail } from "@/lib/services/sendEmail";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface IPostSendInvoiceBody {
  orderData: IGenerateInvoiceEmailParams;
}
export interface IPostSendInvoiceResponse {
  success: boolean;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const { orderData }: IPostSendInvoiceBody = req.body;
  const emailContent = generateInvoiceEmail(orderData);
  await sendEmail({
    to: session?.user?.email || "",
    from: process.env.EMAIL_FROM!,
    subject: `Hello ${session?.user?.name || ""}! Invoice for your payment`,
    html: emailContent,
  });

  res.status(200).json({ success: true });
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
