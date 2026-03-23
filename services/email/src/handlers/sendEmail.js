import { transporter, SMTP_FROM_EMAIL, SMTP_FROM_NAME } from "../config/mailer.js";
import { otpTemplate } from "../templates/otpTemplate.js";

const CURR_SERVICE_NAME = "email-service";

const sendEmail = async (payload) => {
  try {
    payload = payload || {};

    const to = String(payload?.to || "").trim().toLowerCase();
    const subject = String(payload?.subject || "").trim();
    const template = String(payload?.template || "").trim();
    const data = payload?.data || {};

    if (!to || !subject || !template) {
      console.error(`[${CURR_SERVICE_NAME}] Missing required fields in email payload:`, {
        to,
        subject,
        template,
      });

      return {
        success: false,
        message: "Missing required fields: to, subject, template",
      };
    }

    const fromEmail = String(SMTP_FROM_EMAIL || "").trim();
    const fromName = String(SMTP_FROM_NAME || "").trim() || "Support";

    if (!fromEmail) {
      console.error(`[${CURR_SERVICE_NAME}] SMTP_FROM_EMAIL is not configured`);
      return {
        success: false,
        message: "SMTP from email is not configured",
      };
    }

    let htmlContent = "";

    if (template === "otp") {
      const otp = String(data?.otp || "").trim();
      const templateEmail = String(data?.email || to).trim().toLowerCase();
      const expiryMinutes = Number(data?.expiryMinutes || 10);
      const headline = String(data?.headline || "").trim() || undefined;
      const intro = String(data?.intro || "").trim() || undefined;
      const actionText = String(data?.actionText || "").trim() || undefined;
      const helpText = String(data?.helpText || "").trim() || undefined;

      if (!otp) {
        console.error(`[${CURR_SERVICE_NAME}] Missing OTP in template data`);
        return {
          success: false,
          message: "Missing OTP in template data",
        };
      }

      htmlContent = otpTemplate(otp, templateEmail, expiryMinutes, {
        headline,
        intro,
        actionText,
        helpText,
      });
    } else {
      console.error(`[${CURR_SERVICE_NAME}] Unknown email template:`, template);
      return {
        success: false,
        message: `Unknown email template: ${template}`,
      };
    }

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html: htmlContent,
    };

    console.log(`[${CURR_SERVICE_NAME}] Sending email...`, {
      to,
      subject,
      template,
      from: mailOptions.from,
    });

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[${CURR_SERVICE_NAME}] Email sent successfully to ${to}:`,
      info?.messageId
    );
    console.log(
      `[${CURR_SERVICE_NAME}] Email Send Success - To: ${to}, Template: ${template}, Subject: ${subject}`
    );

    return {
      success: true,
      message: "Email sent successfully",
      messageId: info?.messageId || null,
    };
  } catch (error) {
    console.error(`[${CURR_SERVICE_NAME}] Error sending email:`, error);

    return {
      success: false,
      message: `Failed to send email: ${error?.message || "Unknown error"}`,
    };
  }
};

export { sendEmail };
