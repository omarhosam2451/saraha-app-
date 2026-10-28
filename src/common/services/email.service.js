import envConfig from "../../config/env.config.js";
import { transporter as emailTransporter } from "../clients/emailClient.js";
import { BadRequestException } from "../../uitilties/error/exceptions.error.js";
import EventEmitter from "node:events";

const { email } = envConfig;

export const sendEmail = async ({
  to,
  subject = "No reply",
  message,
  attachments = [],
}) => {
  if (!message && !attachments.length) {
    throw new BadRequestException(
      "Message or attachments are required",
      null,
      "SEND_MAIL_ERROR",
    );
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"No-reply" <${email.user}>`,
      to,
      subject,
      html: message,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (err) {
    console.error("Error while sending mail:", err);
    throw new BadRequestException(
      "Error while sending mail:",
      err,
      "SEND_MAIL_ERROR",    
    );
  }
};

export const eventEmitter = new EventEmitter();
eventEmitter.on(
  "send-email",
   ({to, subject, message, attachments}={}) => {
    sendEmail({
      to,
      subject: subject || "Saraha App Notification",
      message,
      attachments,
  })
  
    console.log("message send successfully");
   }
);
