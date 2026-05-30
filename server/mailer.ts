import nodemailer from 'nodemailer';
import { dbService } from './db';

// Lazy initialized transporter
let transporter: any = null;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER || 'admin@dundee.in';
  const pass = process.env.SMTP_PASS;

  if (!host || !pass) {
    // If not configured, we'll run in simulation mode
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  emailType
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType: string;
}): Promise<{ success: boolean; mode: 'SMTP' | 'SIMULATED'; error?: string }> {
  try {
    const client = getTransporter();
    const sender = process.env.SMTP_USER || 'admin@dundee.in';

    if (!client) {
      // SMTP not fully configured - log simulation
      console.log(`[SMTP SIMULATION] To: ${to} | Subject: ${subject}`);
      console.log(`[SMTP SIMULATION] Content Preview: ${text.substring(0, 100)}...`);
      
      dbService.addSentOtpLog(to, emailType, 'SIMULATED');
      return { success: true, mode: 'SIMULATED' };
    }

    await client.sendMail({
      from: `"CanvasCloud Platform" <${sender}>`,
      to,
      subject,
      text,
      html
    });

    dbService.addSentOtpLog(to, emailType, 'SUCCESS');
    return { success: true, mode: 'SMTP' };
  } catch (error: any) {
    console.error(`SMTP delivery failed to ${to}:`, error);
    dbService.addSentOtpLog(to, emailType, 'FAILED');
    return { success: false, mode: 'SMTP', error: error.message };
  }
}

// 1. Generate beautiful HTML for OTP Verification Email
export function makeOtpTemplate(otp: string): { html: string; text: string } {
  const text = `Your CanvasCloud account verification code is: ${otp}. It will expire in 5 minutes.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 10px;">C</span>
        <h2 style="color: #111827; font-size: 22px; margin-top: 15px; margin-bottom: 5px; font-weight: 700; letter-spacing: -0.5px;">Verify your email</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Confirm your registration at CanvasCloud</p>
      </div>
      <div style="background-color: #f9fafb; padding: 25px; border-radius: 10px; text-align: center; border: 1px solid #f3f4f6; margin-bottom: 20px;">
        <p style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 10px;">Your 6-Digit Code</p>
        <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; font-family: monospace; line-height: 1;">${otp}</div>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
        This code is valid for exactly <strong>5 minutes</strong>. If you did not request this code, please ignore this email.
      </p>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">CanvasCloud SaaS, inc • admin@dundee.in</p>
      </div>
    </div>
  `;
  return { html, text };
}

// 2. Beautiful Welcome Email
export function makeWelcomeTemplate(userName: string): { html: string; text: string } {
  const text = `Welcome ${userName} to CanvasCloud! Your Free plan with 500 AI sketch tokens is activated.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 10px;">C</span>
        <h2 style="color: #111827; font-size: 24px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">Welcome to CanvasCloud!</h2>
        <p style="color: #4f46e5; font-size: 14px; font-weight: 600; margin: 0;">Hi ${userName}, your account is officially set up!</p>
      </div>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
        We're thrilled to have you! CanvasCloud is an AI-powered vector illustration & sketching workspace built for modern creators. 
      </p>
      <div style="background-color: #e0e7ff; padding: 15px 20px; border-radius: 10px; margin-bottom: 25px;">
        <h4 style="color: #312e81; font-size: 13px; margin: 0 0 5px 0; font-weight: 700;">🎁 What is included in your FREE plan:</h4>
        <ul style="color: #3730a3; font-size: 12px; margin: 0; padding-left: 20px; line-height: 1.5;">
          <li>500 complimentary AI Draw Assistant tokens</li>
          <li>Standard AI Copilot Integration (using 'gemini-3.5-flash')</li>
          <li>Unlimited multi-layer vector canvas exports</li>
        </ul>
      </div>
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://ais-dev-palwg5gghjdi7bi7myppfa-668489086007.asia-southeast1.run.app" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);">Launch Drawing Canvas</a>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">CanvasCloud SaaS, inc • admin@dundee.in</p>
      </div>
    </div>
  `;
  return { html, text };
}

// 3. User Password Reset Email
export function makePasswordResetTemplate(tempCode: string): { html: string; text: string } {
  const text = `Your CanvasCloud password reset token is: ${tempCode}. Use this temporary key on your reset screen.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 10px;">C</span>
        <h2 style="color: #111827; font-size: 22px; margin-top: 15px; margin-bottom: 5px; font-weight: 700; letter-spacing: -0.5px;">Reset Password</h2>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">We received a request to change your password.</p>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
        Please copy the temporary key below and paste it into the reset field on the authentication page:
      </p>
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fecaca; margin-bottom: 20px;">
        <div style="font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #dc2626; font-family: monospace;">${tempCode}</div>
      </div>
      <p style="color: #e11d48; font-size: 11px; line-height: 1.5; font-weight: 500; text-align: center; margin-bottom: 25px;">
        Warning: This code will expire in <strong>5 minutes</strong>. If you did not trigger this request, secure your email immediately.
      </p>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">CanvasCloud SaaS, inc • admin@dundee.in</p>
      </div>
    </div>
  `;
  return { html, text };
}

// 4. Subscription Upgrade Mailer
export function makeUpgradeTemplate(userName: string, tier: string, tokenCount: number): { html: string; text: string } {
  const text = `Success! Your CanvasCloud account has been upgraded to ${tier}. Your quota allocation has been refreshed.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 10px;">★</span>
        <h2 style="color: #111827; font-size: 22px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">Plan Upgrade Complete!</h2>
        <p style="color: #10b981; font-size: 13px; font-weight: 600; margin: 0;">Hi ${userName}, welcome to ${tier} status!</p>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
        We have processed your subscription payment successfully. Your new tier privileges are fully provisioned, allowing speedier AI processing, high resolution tools, and extended limits.
      </p>
      <div style="background-color: #f0fdf4; border: 1px solid #d1fae5; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #065f46;">
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Subscribed Tier:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold;">${tier}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Deductions Rate:</td>
            <td style="padding: 4px 0; text-align: right;">Standard Base Rate</td>
          </tr>
          <tr style="border-top: 1px solid #d1fae5;">
            <td style="padding: 10px 0 0 0; font-weight: bold; font-size: 14px;">Quota Allocation:</td>
            <td style="padding: 10px 0 0 0; text-align: right; font-weight: 800; font-size: 15px; color: #10b981;">+${tokenCount.toLocaleString()} Tokens</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://ais-dev-palwg5gghjdi7bi7myppfa-668489086007.asia-southeast1.run.app" style="display: inline-block; padding: 12px 24px; background: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 8px;">Explore Pro Features</a>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">CanvasCloud SaaS, inc • admin@dundee.in</p>
      </div>
    </div>
  `;
  return { html, text };
}
