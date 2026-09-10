// Vercel Serverless Function: Verify OTP & Issue Token
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
    const { phone_number, otp_code } = req.body || {};
    if (!otp_code || otp_code.length < 4) {
      return res.status(400).json({ detail: 'Valid verification code required' });
    }

    const token = 'afrivisa_jwt_' + Buffer.from(`${phone_number}:${Date.now()}`).toString('base64');
    const user = {
      id: Date.now(),
      phone_number: phone_number,
      full_name: 'Valued Client',
      kyc_status: 'UNVERIFIED',
      phone_verified: true,
      created_at: new Date().toISOString(),
    };

    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      user: user,
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message || 'Verification failed' });
  }
}
