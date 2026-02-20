const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const getOtpEmailTemplate = (otp, purpose) => {
  const purposeMessages = {
    registration: {
      title: 'Welcome to CheapShip!',
      message: 'Thank you for registering with CheapShip. Please use the following OTP to verify your email address:',
    },
    login: {
      title: 'Login Verification',
      message: 'Use the following OTP to complete your login:',
    },
    forgot_password: {
      title: 'Password Reset',
      message: 'You requested to reset your password. Use the following OTP to proceed:',
    },
  };

  const { title, message } = purposeMessages[purpose] || purposeMessages.registration;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .email-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .message {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .otp-container {
          background: #f7fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .otp-label {
          color: #718096;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #667eea;
        }
        .expiry-note {
          color: #e53e3e;
          font-size: 14px;
          margin-top: 20px;
        }
        .footer {
          background: #f7fafc;
          padding: 20px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #718096;
          font-size: 13px;
          margin: 0;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">CheapShip</div>
          </div>
          <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 20px;">${title}</h2>
            <p class="message">${message}</p>
            <div class="otp-container">
              <p class="otp-label">Your One-Time Password (OTP)</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p class="expiry-note">This OTP will expire in 5 minutes. Do not share it with anyone.</p>
          </div>
          <div class="footer">
            <p>If you did not request this OTP, please ignore this email.</p>
            <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} CheapShip. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendOtpEmail = async (email, otp, purpose = 'registration') => {
  const transporter = getTransporter();
  
  const subjectMap = {
    registration: 'CheapShip - Verify Your Email',
    login: 'CheapShip - Login OTP',
    forgot_password: 'CheapShip - Password Reset OTP',
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cheapship.com',
    to: email,
    subject: subjectMap[purpose] || 'CheapShip - OTP Verification',
    html: getOtpEmailTemplate(otp, purpose),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return { success: true, messageId: 'dev-mode', devOtp: otp };
    }
    
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
  getOtpEmailTemplate,
};
