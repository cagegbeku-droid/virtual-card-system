import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const NETWORKS = [
  { id: 'MTN', name: 'MTN MoMo', color: 'from-amber-400 to-yellow-500 text-slate-900 border-amber-300', bg: 'bg-yellow-400' },
  { id: 'TELECEL', name: 'Telecel Cash', color: 'from-red-600 to-rose-700 text-white border-red-400', bg: 'bg-red-600' },
  { id: 'AT', name: 'AT Money', color: 'from-blue-600 to-cyan-700 text-white border-blue-400', bg: 'bg-blue-600' },
];

const PRESETS = [50, 100, 250, 500, 1000];

export default function MoMoTopupModal({ card, fxRate = 15.50, feePercent = 1.5, isOpen, onClose, onSuccess }) {
  const [network, setNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('0244123456');
  const [ghsAmount, setGhsAmount] = useState('250');
  const [loading, setLoading] = useState(false);
  const [ussdStep, setUssdStep] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const numGhs = parseFloat(ghsAmount) || 0;
  const feeGhs = (numGhs * (feePercent / 100));
  const netGhs = Math.max(0, numGhs - feeGhs);
  const estimatedUsd = (netGhs / fxRate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numGhs < 20) {
      setError('Minimum top-up amount is GHS 20.00');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid Ghana phone number (e.g. 0244123456)');
      return;
    }

    // Step 1: Simulate USSD prompt
    setLoading(true);
    setUssdStep(true);

    try {
      // Simulate real-world USSD authorization delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          network,
          phone_number: phoneNumber,
          ghs_amount: numGhs,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Top-up failed');
      }

      const data = await response.json();
      setSuccessData(data);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'An error occurred during top-up');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-100">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* SUCCESS SCREEN */
          <div className="flex flex-col items-center text-center py-6 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Top-Up Successful!</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Funds have been converted and loaded onto your virtual Visa.
            </p>

            <div className="w-full bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>MoMo Paid</span>
                <span className="font-semibold text-white">GHS {successData.ghs_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>USD Credited</span>
                <span className="font-bold text-emerald-400">+${successData.usd_credited.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>New Card Balance</span>
                <span className="font-semibold text-white">${successData.new_balance.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>Reference</span>
                <span className="font-mono text-[11px] text-zinc-300">{successData.reference}</span>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/20"
            >
              Done & Return to Card
            </button>
          </div>
        ) : ussdStep && loading ? (
          /* USSD PUSH STEP */
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 animate-pulse">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Authorizing MoMo Payment</h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6">
              A prompt has been dispatched to <span className="font-semibold text-amber-400">{phoneNumber}</span>. Enter your Mobile Money PIN on your phone to complete the transaction.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Awaiting payment confirmation...</span>
            </div>
          </div>
        ) : (
          /* INPUT FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white">Top Up Virtual Card</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Instant Mobile Money deposit to Visa ending in <span className="font-mono text-zinc-300 font-semibold">{card?.masked_number?.slice(-4)}</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Network */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Select Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setNetwork(net.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      network === net.id
                        ? `bg-zinc-800 text-white border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/40`
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${net.bg}`} />
                    <span>{net.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Mobile Money Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 text-xs font-bold">
                  🇬🇭 +233
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="024 123 4567"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 pl-20 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Amount in GHS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Amount to Deposit
                </label>
                <span className="text-[11px] text-zinc-400">
                  Rate: 1 USD ≈ {fxRate} GHS
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-zinc-400">
                  GHS
                </span>
                <input
                  type="number"
                  step="any"
                  value={ghsAmount}
                  onChange={(e) => setGhsAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 pl-14 pr-4 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                {PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGhsAmount(amt.toString())}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                  >
                    GHS {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Exchange Calculation Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>MoMo Network Fee ({feePercent}%)</span>
                <span>GHS {feeGhs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Net Converted Amount</span>
                <span>GHS {netGhs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-100 font-bold pt-1.5 border-t border-zinc-800">
                <span>Estimated Card Credit</span>
                <span className="text-emerald-400 font-mono text-sm">+${estimatedUsd.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || numGhs <= 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              <span>Confirm & Pay GHS {numGhs.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
