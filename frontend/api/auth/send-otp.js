// Vercel Serverless Function: Resend Arkesel SMS OTP
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const { phone_number } = req.body || {};
    if (!phone_number) {
      return res.status(400).json({ detail: 'Phone number required' });
    }

    let cleanPhone = phone_number.trim().replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '233' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('233')) {
      cleanPhone = '233' + cleanPhone;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const arkeselApiKey = process.env.ARKESEL_API_KEY || 'U3ZWUm5CdHB1SVFGVWJVUkh6YWQ';

    const smsRes = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': arkeselApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: 'Coratech',
        message: `Your AfriVisa verification code is: ${otp}. Valid for 10 minutes.`,
        recipients: [cleanPhone],
      }),
    });

    const smsData = await smsRes.json();
    return res.status(200).json({
      status: 'success',
      message: 'Verification code resent via Arkesel SMS',
      data: smsData,
      debug_otp: otp,
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message || 'SMS dispatch failed' });
  }
}
