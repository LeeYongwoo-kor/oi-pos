import CustomError from "@/utils/CustomError";
import hasNullUndefined from "@/utils/hasNullUndefined";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface IEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, from, subject, html }: IEmailParams) {
  const msg = {
    to,
    from,
    subject,
    html,
  };

  try {
    if (hasNullUndefined({ to, from, subject, html })) {
      throw new Error("Missing email parameters");
    }

    await sgMail.send(msg);
    console.log("Email sent successfully");
  } catch (error) {
    const errorIns = error instanceof Error ? error : new Error(String(error));
    console.error("Error sending email: ", error);
    throw new CustomError(errorIns.message, errorIns);
  }
}
