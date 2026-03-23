/**
 * OTP Email Template
 * @param {string} otp - One-time password
 * @param {string} email - Recipient email
 * @returns {string} HTML email template
 */
const otpTemplate = (otp, email) => `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #007bff; text-align: center;">Verify Your Email</h2>
      
      <p>Hi,</p>
      
      <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
      </div>
      
      <p>This OTP is valid for 10 minutes.</p>
      
      <p>If you did not request this email, please ignore it.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      
      <p style="font-size: 12px; color: #777;">
        <strong>All Spark</strong><br>
        Email: ${email}
      </p>
    </div>
  </body>
</html>
`;

export { otpTemplate };
