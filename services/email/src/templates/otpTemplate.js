const otpTemplate = (
  otp,
  email,
  expiryMinutes = 10,
  {
    headline = "Password Reset Request",
    intro = "We received a request to reset your password. If you did not make this request, you can ignore this email.",
    actionText = "Use the OTP below to continue:",
    helpText = "If you need further assistance, please contact our support team.",
  } = {}
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headline}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
        }
        .header {
          color: #333;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #2c3e50;
        }
        .otp-box {
          background-color: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #007bff;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .info-text {
          color: #666;
          font-size: 16px;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer {
          color: #999;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headline}</h1>
        </div>
        
        <p class="info-text">
          ${intro}
        </p>
        
        <p class="info-text">
          ${actionText}
        </p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        
        <div class="warning">
          <strong>⏰ This OTP will expire in ${expiryMinutes} minutes.</strong> Do not share this code with anyone.
        </div>
        
        <div class="warning">
          <strong>🔒 For Security:</strong> Never share this OTP with anyone, including support staff. We will never ask you for your OTP.
        </div>
        
        <p class="info-text">
          ${helpText}
        </p>
        
        <div class="footer">
          <p><strong>All Spark Platform</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2026 All Spark. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export { otpTemplate };
