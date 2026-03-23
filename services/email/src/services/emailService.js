import { transporter, SMTP_FROM_EMAIL, SMTP_FROM_NAME } from "../utils/emailTransporter.js";
import { otpTemplate } from "../utils/emailTemplates.js";

/**
 * Email Service - Sends emails using configured transporter
 * Centralizes all email sending logic
 */
const CURR_SERVICE_NAME = "email-service";

/**
 * Send email using transporter
 * @param {object} payload - Email payload
 * @returns {Promise<object>} Send result
 */
const sendEmail = async (payload) => {
  try {
    payload = payload || {};

    const to = String(payload?.to || "").trim().toLowerCase();
    const subject = String(payload?.subject || "").trim();
    const template = String(payload?.template || "").trim();
    const data = payload?.data || {};

    if (!to || !subject || !template) {
      console.error(`[${CURR_SERVICE_NAME}] Missing required email fields:`, {
        to,
        subject,
        template,
      });

      return {
        success: false,
        message: "Missing required fields: to, subject, template",
      };
    }

    let htmlContent = "";

    if (template === "otp") {
      const otp = String(data?.otp || "").trim();

      if (!otp) {
        console.error(`[${CURR_SERVICE_NAME}] Missing OTP in template data`);
        return {
          success: false,
          message: "Missing OTP in template data",
        };
      }

      htmlContent = otpTemplate(otp, to);
    } else {
      console.error(`[${CURR_SERVICE_NAME}] Unknown email template:`, template);
      return {
        success: false,
        message: `Unknown email template: ${template}`,
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

    const result = await transporter.sendMail(mailOptions);

    console.log(`[${CURR_SERVICE_NAME}] Email sent to ${to}:`, result?.messageId);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: result?.messageId || null,
    };
  } catch (error) {
    console.error(`[${CURR_SERVICE_NAME}] Error sending email:`, error);

    return {
      success: false,
      message: "Failed to send email",
      error: error?.message || "Unknown error",
    };
  }
};

export { sendEmail };
