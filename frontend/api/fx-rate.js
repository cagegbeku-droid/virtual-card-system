// Vercel Serverless Function: Bank of Ghana FX Rate
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    fx_rate: 11.55,
    fee_percent: 1.5,
    base_currency: 'USD',
    quote_currency: 'GHS',
    min_topup_ghs: 20.0,
  });
}
