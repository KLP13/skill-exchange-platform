import nodemailer from "nodemailer";

export interface SendOtpOptions {
  toEmail: string;
  fullName: string;
  otp: string;
  expiresInMinutes?: number;
}

/**
 * Creates and returns a Nodemailer transporter based on .env config.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    } as any);
  }

  return null;
}

/**
 * Sends a 6-digit verification OTP email to a student's VIT email address.
 */
export async function sendSignupVerificationEmail(options: SendOtpOptions): Promise<{ delivered: boolean; info?: any }> {
  const { toEmail, fullName, otp, expiresInMinutes = 10 } = options;
  const user = process.env.SMTP_USER?.trim() || "noreply@skillswap.vit.ac.in";
  const from = `"SkillSwap VIT" <${user}>`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; color: #334155; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #7c3aed; font-family: monospace; }
    .note { font-size: 13px; color: #64748b; margin-top: 16px; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 SkillSwap @ VIT</h1>
      <p>Campus Peer-to-Peer Skill Exchange</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${fullName || "VIT Student"},</div>
      <p>Thank you for signing up for SkillSwap! Please verify your VIT email address to activate your account and claim your <strong>+40 welcome credits</strong>.</p>
      
      <div class="otp-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">Your 6-Digit Verification Code</div>
        <div class="otp-code">${otp}</div>
      </div>

      <p class="note">
        ⏱️ This code will expire in <strong>${expiresInMinutes} minutes</strong>.<br>
        🔒 If you did not request this email, you can safely ignore it. Do not share this code with anyone.
      </p>
    </div>
    <div class="footer">
      VIT Campus Skill Exchange • Vellore Institute of Technology<br>
      Automated verification system — Please do not reply to this email.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Hello ${fullName},\n\nYour SkillSwap VIT verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this email.`;

  console.log(`\n======================================================`);
  console.log(`✉️  [EMAIL DISPATCH] VIT Email Verification`);
  console.log(`   To:      ${toEmail} (${fullName})`);
  console.log(`   OTP:     🔑 ${otp}`);
  console.log(`   Expires: In ${expiresInMinutes} minutes`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`ℹ️  [SMTP NOTICE] No SMTP credentials configured in .env. OTP printed to console above for dev testing.`);
    return { delivered: true, info: "console_fallback" };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `SkillSwap VIT Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    });
    console.log(`✅ [SMTP SUCCESS] Real email sent to ${toEmail}: ${info.messageId}`);
    return { delivered: true, info };
  } catch (error: any) {
    console.error(`⚠️ [SMTP ERROR] Failed to send email via SMTP: ${error.message}`);
    console.log(`🔑 [DEV OTP FALLBACK] The OTP for ${toEmail} is: ${otp}`);
    return { delivered: false, info: error.message };
  }
}
