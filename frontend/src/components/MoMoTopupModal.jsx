import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { safeFetch } from '../api';

const NETWORKS = [
  { id: 'MTN', name: 'MTN Mobile Money', short: 'MTN MoMo', code: '024 / 054 / 055 / 059' },
  { id: 'TELECEL', name: 'Telecel Cash', short: 'Telecel', code: '020 / 050' },
  { id: 'AT', name: 'AT Money', short: 'AT Money', code: '027 / 057' },
];

const PRESETS = [50, 100, 200, 500, 1000];

export default function MoMoTopupModal({ card, fxRate = 11.55, feePercent = 1.5, isOpen, onClose, onSuccess }) {
  const [network, setNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('0244123456');
  const [ghsAmount, setGhsAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [ussdStep, setUssdStep] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const numGhs = parseFloat(ghsAmount) || 0;
  const feeGhs = numGhs * (feePercent / 100);
  const netGhs = Math.max(0, numGhs - feeGhs);
  const estimatedUsd = netGhs / (fxRate || 11.55);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numGhs < 20) {
      setError('Minimum top-up amount is GHS 20.00');
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid Ghana phone number (e.g. 0244123456)');
      return;
    }

    setLoading(true);
    setUssdStep(true);

    try {
      const res = await safeFetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card?.id,
          network,
          phone_number: cleanPhone,
          ghs_amount: numGhs,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || 'Mobile money authorization timed out or declined');
      }

      const data = res.data || {
        ghs_amount: numGhs,
        usd_credited: estimatedUsd,
        new_balance: Number(card?.balance ?? 0) + estimatedUsd,
        reference: `MOMO_${Date.now()}`,
      };

      setSuccessData(data);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'An error occurred during mobile money top-up');
      setUssdStep(false);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setUssdStep(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in text-slate-100">
      <div className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-xl p-5 sm:p-7 shadow-2xl overflow-hidden">
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Top Up Virtual Visa Card</h3>
            <p className="text-xs text-slate-400 font-mono">
              Paystack Mobile Money Rails • Bank of Ghana interbank rate
            </p>
          </div>
        </div>

        {/* SUCCESS VIEW */}
        {successData ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Funds Successfully Credited</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Your Visa card ending in {card?.masked_number ? card.masked_number.slice(-4) : '8824'} is loaded and ready.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Money Paid:</span>
                <span className="text-white font-semibold">GH₵ {Number(successData.ghs_amount ?? numGhs).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">USD Credited:</span>
                <span className="text-emerald-400 font-bold">+${Number(successData.usd_credited ?? estimatedUsd).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exchange Rate:</span>
                <span className="text-slate-300">1 USD = {fxRate} GHS</span>
              </div>
              <div className="flex justify-between border-t border-[#30363d] pt-2">
                <span className="text-slate-400">Updated Card Balance:</span>
                <span className="text-emerald-400 font-bold">${Number(successData.new_balance ?? 0).toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors font-sans"
            >
              Done
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Network Selector */}
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1.5">
                Select Mobile Money Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNetwork(n.id)}
                    className={`p-2.5 rounded-md border text-left transition-colors ${
                      network === n.id
                        ? 'bg-[#21262d] border-emerald-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs text-white">{n.short}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{n.code}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                MoMo Wallet Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="024 412 3456"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                required
              />
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Top-Up Amount (Ghana Cedis)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                  GH₵
                </span>
                <input
                  type="number"
                  min="20"
                  step="1"
                  value={ghsAmount}
                  onChange={(e) => setGhsAmount(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-2 pl-12 pr-3 text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                {PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGhsAmount(String(amt))}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                      ghsAmount === String(amt)
                        ? 'bg-[#21262d] text-emerald-400 border-emerald-500'
                        : 'bg-[#0d1117] text-slate-400 border-[#30363d] hover:text-white'
                    }`}
                  >
                    GH₵ {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Transparent FX Conversion Box */}
            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Commercial Exchange Rate:</span>
                <span className="text-white font-semibold">1 USD = {fxRate} GHS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network Processing Fee (1.5%):</span>
                <span>GH₵ {feeGhs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Net Converted to USD:</span>
                <span>GH₵ {netGhs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#30363d] pt-2">
                <span className="text-slate-300 font-semibold">Card Balance Credited:</span>
                <span className="text-emerald-400 font-bold text-sm">+${estimatedUsd.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || numGhs < 20}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Awaiting MoMo Prompt on {phoneNumber}...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay GH₵ {numGhs.toFixed(2)} via Paystack</span>
                </>
              )}
            </button>
            <span className="block text-center text-[10px] text-slate-500">
              You will receive an instant USSD prompt on your phone to approve with your MoMo PIN.
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
