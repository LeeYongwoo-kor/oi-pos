export interface IOrderData {
  orderId: string;
  planName: string;
  amount: number;
}

export function generateInvoiceEmail(orderData: IOrderData): string {
  return `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; max-width: 600px; margin-left: auto; margin-right: auto;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 5px;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Yoshi-POS Invoice</h1>
        <p>Thank you for your payment. Here are the order details:</p>
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Order ID:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${orderData.orderId}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Plan:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${orderData.planName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Amount:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${orderData.amount}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
}
