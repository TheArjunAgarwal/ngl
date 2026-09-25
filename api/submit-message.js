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
    const emailSubject = `New Anonymous Message`;
    const receivedTime = new Date().toLocaleString();
    const senderIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';

    const emailBody = `
Anonymous Message:

${sanitizedMessage}

---
Received: ${receivedTime}
IP: ${senderIP}
    `.trim();

    // HTML email template styled like NGL message card
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #FDBE02, #FF8040);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            color: #6b7280;
            font-size: 14px;
        }
        .message-card {
            background: linear-gradient(135deg, #FDBE02, #FF8040);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            color: white;
            min-height: 120px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 12px rgba(253, 190, 2, 0.3);
        }
        .message-text {
            font-size: 16px;
            line-height: 1.6;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-weight: 500;
        }
        .metadata {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin-top: 24px;
            font-size: 13px;
            color: #6b7280;
        }
        .metadata p {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 New Anonymous Message</h1>
            <p>You received a message on your form</p>
        </div>
        
        <div class="message-card">
            <div class="message-text">${sanitizedMessage}</div>
        </div>
        
        <div class="metadata">
            <p><strong>Received:</strong> ${receivedTime}</p>
            <p><strong>Sender IP:</strong> ${senderIP}</p>
        </div>
        
        <div class="footer">
            <p>Reply to this email or visit your form to respond</p>
        </div>
    </div>
</body>
</html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      text: emailBody,
      html: htmlTemplate,
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully!',
    });
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Error sending message:', errorMessage);
    console.error('Error stack:', error?.stack);
    
    try {
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    } catch (jsonError) {
      // Fallback if JSON encoding fails
      return res.status(500).send(`Error: ${errorMessage}`);
    }
  }
}
