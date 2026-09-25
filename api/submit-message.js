import nodemailer from 'nodemailer';

// Configure your email service
// For Gmail: use app passwords (https://support.google.com/accounts/answer/185833)
// For other services: update the config accordingly
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,      // Set in Vercel environment variables
    pass: process.env.EMAIL_PASSWORD,  // Set in Vercel environment variables
  },
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    // Sanitize and limit message length
    const sanitizedMessage = message.trim().substring(0, 5000);

    // Get recipient email from environment variable
    const recipientEmail = process.env.RECIPIENT_EMAIL;
    if (!recipientEmail) {
      console.error('RECIPIENT_EMAIL not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    // Prepare email content
    const emailSubject = `New Anonymous Message - ${new Date().toLocaleString()}`;
    const emailBody = `
Anonymous Message Received:

${sanitizedMessage}

---
Received: ${new Date().toLocaleString()}
IP: ${req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown'}
    `.trim();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      text: emailBody,
      html: `<pre>${emailBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully!',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
    });
  }
}
