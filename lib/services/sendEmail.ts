import hasNullUndefined from "@/utils/checkNullUndefined";
import sgMail from "@sendgrid/mail";
import { UnexpectedError, ValidationError } from "../shared/CustomError";

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
    if (!hasNullUndefined({ to, from, subject, html })) {
      throw new ValidationError("Failed to send email. Please try again later");
    }

    await sgMail.send(msg);
    if (process.env.NODE_ENV === "development") {
      console.log("Email sent successfully");
    }
  } catch (err) {
    //TODO: send error to sentry
    console.error(err);
    if (err instanceof ValidationError) {
      throw err;
    }
    const unexpectedError = err instanceof Error ? err : new Error(String(err));
    throw new UnexpectedError(unexpectedError.message);
  }
}
