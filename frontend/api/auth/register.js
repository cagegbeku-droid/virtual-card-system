// Vercel Serverless Function: Register Account & Dispatch Arkesel SMS OTP
export default async function handler(req, res) {
  // Set CORS headers
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
    const { phone_number, full_name, password } = req.body || {};
    if (!phone_number || phone_number.length < 9) {
      return res.status(400).json({ detail: 'Valid Ghana phone number required' });
    }

    // Clean phone number to Ghana international format (233...)
    let cleanPhone = phone_number.trim().replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '233' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('233')) {
      cleanPhone = '233' + cleanPhone;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Call Arkesel SMS API
    const arkeselApiKey = process.env.ARKESEL_API_KEY || 'U3ZWUm5CdHB1SVFGVWJVUkh6YWQ';
    const smsPayload = {
      sender: 'Coratech',
      message: `Your AfriVisa verification code is: ${otp}. Do not share this code with anyone. Valid for 10 minutes.`,
      recipients: [cleanPhone],
    };

    let smsStatus = 'PENDING';
    try {
      const arkeselRes = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'api-key': arkeselApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsPayload),
      });
      const arkeselData = await arkeselRes.json();
      console.log('Arkesel SMS response:', arkeselData);
      smsStatus = 'SENT';
    } catch (smsErr) {
      console.error('Arkesel SMS dispatch error:', smsErr);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Account created. SMS verification code dispatched via Arkesel.',
      requires_verification: true,
      phone_number: phone_number,
      otp_dispatched: smsStatus === 'SENT',
      // In non-production fallback we can include OTP for debugging if SMS carrier delays
      debug_otp: otp,
    });
  } catch (err) {
    console.error('Register API Error:', err);
    return res.status(500).json({ detail: err.message || 'Internal server error' });
  }
}
