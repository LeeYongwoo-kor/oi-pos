export interface IGenerateInvoiceEmailParams {
  orderId: string;
  planName: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
}

export function generateInvoiceEmail({
  orderId,
  planName,
  amount,
  createdAt,
  expiresAt,
}: IGenerateInvoiceEmailParams): string {
  return `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; max-width: 600px; margin-left: auto; margin-right: auto;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 5px;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Yoshi-POS Invoice</h1>
        <p>Thank you for your payment. Here are the order details:</p>
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Order ID:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${orderId}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Plan:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${planName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Amount:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${amount}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Start:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${createdAt}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Expiration:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${expiresAt}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
}
