const nodemailer = require('nodemailer');
const config = require('../config');

// Create Transporter (Prioritize Mailtrap for testing, fallback to generic SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAILTRAP_PORT || process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.MAILTRAP_USER || process.env.EMAIL_USER,
    pass: process.env.MAILTRAP_PASS || process.env.EMAIL_PASS
  }
});

/**
 * Send Professional Email
 */
async function sendEmail({ to, subject, html }) {
  const user = process.env.MAILTRAP_USER || process.env.EMAIL_USER;
  const pass = process.env.MAILTRAP_PASS || process.env.EMAIL_PASS;
  const isEmailDisabled = process.env.EMAIL_VERIFICATION === 'false';

  if (!user || !pass || isEmailDisabled) {
    console.log('\n' + '='.repeat(50));
    console.log(`📧  EMAIL ${isEmailDisabled ? 'BYPASS ACTIVE' : 'NOT CONFIGURED'} (LOGGING TO CONSOLE)`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(50));
    console.log(`📄  BODY: ${html.substring(0, 100)}... [Truncated]`);
    console.log('='.repeat(50) + '\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Campus ERP" <${user}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

/**
 * Professional HTML Template Wrapper
 */
function getHtmlTemplate(content, title = 'Notification') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 40px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #edf2f7; }
        .button { display: inline-block; padding: 14px 30px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
        .credential-box { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .credential-item { margin: 5px 0; font-family: monospace; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Campus ERP System</h1>
        </div>
        <div class="content">
          <h2 style="color: #1e3a8a; margin-top: 0;">${title}</h2>
          ${content}
        </div>
        <div class="footer">
          &copy; 2024 Campus ERP System. All rights reserved.<br>
          This is an automated message, please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendVerificationEmail(user, token, password) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${token}`;
  
  const content = `
    <p>Welcome to Campus ERP, <strong>${user.name}</strong>!</p>
    <p>An account has been created for you. To get started, please verify your email address and use the following temporary credentials to log in.</p>
    
    <div class="credential-box">
      <div class="credential-item"><strong>Email:</strong> ${user.email}</div>
      <div class="credential-item"><strong>Password:</strong> ${password}</div>
    </div>
    
    <p>Please click the button below to verify your account:</p>
    <a href="${verifyUrl}" class="button">Verify Account</a>
    
    <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
      Note: You will be required to change your password upon your first successful login.
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Campus ERP - Verify Your Account',
    html: getHtmlTemplate(content, 'Account Verification')
  });
}

async function sendResetPasswordEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  
  const content = `
    <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
    <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: getHtmlTemplate(content, 'Reset Your Password')
  });
}

async function sendOTPEmail(email, otp) {
  const content = `
    <p>Your one-time password (OTP) for account verification is:</p>
    <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
      ${otp}
    </div>
    <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Your Verification Code',
    html: getHtmlTemplate(content, 'One-Time Password')
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOTPEmail
};
