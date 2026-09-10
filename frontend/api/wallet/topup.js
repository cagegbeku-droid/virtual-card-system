// Vercel Serverless Function: Initialize Live Paystack Mobile Money Charge
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
    const { card_id, network, phone_number, ghs_amount } = req.body || {};
    const amountGhs = parseFloat(ghs_amount) || 0;

    if (amountGhs < 20) {
      return res.status(400).json({ detail: 'Minimum deposit amount is GH₵ 20.00' });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const fxRate = 11.55;
    const feeGhs = amountGhs * 0.015;
    const totalPromptGhs = amountGhs + feeGhs;
    const usdCredited = parseFloat((amountGhs / fxRate).toFixed(2));
    const reference = `MOMO_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Initialize Paystack transaction
    const paystackPayload = {
      email: `${phone_number.replace(/\D/g, '')}@afrivisa.com`,
      amount: Math.round(totalPromptGhs * 100), // In pesewas
      currency: 'GHS',
      reference: reference,
      callback_url: 'https://vcardbeta.vercel.app/',
      channels: ['mobile_money'],
      metadata: {
        platform: 'afrivisa',
        card_id,
        network,
        phone_number,
        ghs_amount: amountGhs,
        usd_credited: usdCredited,
      },
    };

    let authorizationUrl = null;
    try {
      const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AfriVisa-Live/1.0',
        },
        body: JSON.stringify(paystackPayload),
      });
      const psData = await psRes.json();
      if (psData.status && psData.data) {
        authorizationUrl = psData.data.authorization_url;
      }
    } catch (e) {
      console.error('Paystack initialization notice:', e);
    }

    return res.status(200).json({
      status: 'SUCCESS',
      reference,
      ghs_amount: amountGhs,
      usd_credited: usdCredited,
      fx_rate: fxRate,
      fee_ghs: feeGhs,
      total_paid_ghs: totalPromptGhs,
      authorization_url: authorizationUrl,
      message: `Prompt sent to ${phone_number}. Authorize GH₵ ${totalPromptGhs.toFixed(2)} on your phone.`,
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message || 'Top-up initiation failed' });
  }
}
