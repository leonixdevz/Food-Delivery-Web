require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured. Email contents:', { to, subject, text });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@foodie.com',
      to,
      subject,
      text,
      html
    });
    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
};

// Test email
sendEmail({
  to: 'testfoodie123@gmail.com',
  subject: 'Test Email from Foodie',
  text: 'This is a test email from the Foodie application.',
  html: '<p>This is a <strong>test email</strong> from the Foodie application.</p>'
}).then(result => {
  if (result) {
    console.log('Email test PASSED');
  } else {
    console.log('Email test FAILED');
  }
  process.exit(0);
});
