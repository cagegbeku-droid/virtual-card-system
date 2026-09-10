// Vercel Serverless Function: Issue Virtual Card
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

  if (req.method === 'POST') {
    const { cardholder_name } = req.body || {};
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const card = {
      id: 'card_' + Date.now(),
      masked_number: `4512 7800 1234 ${last4}`,
      cardholder_name: (cardholder_name || 'VALUED CLIENT').toUpperCase(),
      expiry_month: 9,
      expiry_year: 29,
      balance: 0.0,
      daily_limit: 1000.0,
      per_tx_limit: 1000.0,
      currency: 'USD',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    return res.status(201).json(card);
  }

  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
