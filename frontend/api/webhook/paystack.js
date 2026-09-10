// Vercel Serverless Function: Paystack Webhook
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const hash = req.headers['x-paystack-signature'];

  // Verify HMAC signature if secret is provided
  if (paystackSecret && hash) {
    const computedHash = crypto
      .createHmac('sha512', paystackSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== computedHash) {
      return res.status(400).send('Invalid signature');
    }
  }

  const event = req.body;
  if (event && event.event === 'charge.success') {
    const data = event.data;
    console.log('[PAYSTACK WEBHOOK SUCCESS]', data.reference, data.amount, data.currency);
  }

  return res.status(200).send('Webhook acknowledged');
}
