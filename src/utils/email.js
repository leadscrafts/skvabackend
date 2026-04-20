import nodemailer from "nodemailer";
import env from "../config/env.js";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure === "true",
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

const sendLeadNotification = async (leadData, productName = null) => {
  const subject = productName
    ? `New Product Inquiry: ${productName}`
    : "New Lead Submission";

  const html = `
    <h2>New Lead Submission</h2>
    <p><strong>Name:</strong> ${leadData.name}</p>
    <p><strong>Email:</strong> ${leadData.email}</p>
    ${leadData.phone ? `<p><strong>Phone:</strong> ${leadData.phone}</p>` : ""}
    ${leadData.company ? `<p><strong>Company:</strong> ${leadData.company}</p>` : ""}
    ${productName ? `<p><strong>Product:</strong> ${productName}</p>` : ""}
    <p><strong>Inquiry Type:</strong> ${leadData.inquiry_type || "General"}</p>
    ${leadData.source_page ? `<p><strong>Source Page:</strong> ${leadData.source_page}</p>` : ""}
    ${leadData.message ? `<p><strong>Message:</strong><br>${leadData.message}</p>` : ""}
    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
  `;

  const mailOptions = {
    from: leadData.email,
    to: env.adminEmail,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending lead notification email:", error);
  }
};

const generateOTP = (length = 6) => {
  return crypto
    .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
    .toString();
};

const sendForgotPasswordOTP = async (email, otp) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Use the OTP code below to proceed:
        </p>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px;">One-Time Password</p>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1a1a1a; letter-spacing: 4px;">${otp}</p>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 13px;">
            <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If you didn't request a password reset, please ignore this email or contact our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: env.smtp.user,
    to: email,
    subject: "Password Reset OTP - Your One-Time Code",
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending forgot password OTP email:", error);
    throw error;
  }
};

export { sendLeadNotification, sendForgotPasswordOTP, generateOTP };
