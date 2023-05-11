export function generateVerifyLoginEmail(url: string): string {
  return `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; max-width: 600px; margin-left: auto; margin-right: auto;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 5px;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Verify Your Account</h1>
        <p>Please click the button below to verify your account:</p>
        <a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; background-color: #346df1; text-decoration: none; border-radius: 5px; padding: 12px 24px; border: 1px solid #346df1; display: inline-block; font-weight: bold; margin-top: 20px;">Sign in</a>
      </div>
    </div>
  `;
}
