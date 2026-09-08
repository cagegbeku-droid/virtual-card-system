import React, { useState } from 'react';
import { X, ArrowDownRight, Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const NETWORKS = [
  { id: 'MTN', name: 'MTN MoMo', bg: 'bg-yellow-400' },
  { id: 'TELECEL', name: 'Telecel Cash', bg: 'bg-red-600' },
  { id: 'AT', name: 'AT Money', bg: 'bg-blue-600' },
];

export default function CashoutModal({ card, fxRate = 15.50, isOpen, onClose, onSuccess }) {
  const [network, setNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('0244123456');
  const [usdAmount, setUsdAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !card) return null;

  const numUsd = parseFloat(usdAmount) || 0;
  const estimatedGhs = (numUsd * (fxRate - 0.20));

  const handleSweep = async (e) => {
    e.preventDefault();
    setError('');

    if (numUsd <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numUsd > card.balance) {
      setError(`Cannot withdraw more than current card balance ($${card.balance.toFixed(2)})`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/wallet/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          network,
          phone_number: phoneNumber,
          usd_amount: numUsd,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Withdrawal failed');
      }

      const data = await response.json();
      setSuccessData(data);
      confetti({
        particleCount: 70,
        spread: 60,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'An error occurred during cashout');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setError('');
    setUsdAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-100">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={resetAndClose}
          className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="flex flex-col items-center text-center py-6 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Cashout Sent!</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Funds disbursed directly to your {network} wallet ({phoneNumber}).
            </p>

            <div className="w-full bg-zinc-950/70 rounded-2xl p-4 border border-zinc-800 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Withdrawn USD</span>
                <span className="font-semibold text-white">${successData.swept_usd.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Disbursed to MoMo</span>
                <span className="font-bold text-emerald-400">GHS {successData.disbursed_ghs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Remaining Card Balance</span>
                <span className="font-semibold text-white">${successData.new_balance.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSweep} className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-sky-400" />
                <h3 className="text-xl font-bold text-white">Withdraw to Mobile Money</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unload unused USD balance from card back to Ghana MoMo.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Network Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Destination Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setNetwork(net.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      network === net.id
                        ? 'bg-zinc-800 text-white border-sky-400 shadow-md ring-1 ring-sky-400/40'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${net.bg}`} />
                    <span>{net.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MoMo Number */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Recipient MoMo Number
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
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 pl-20 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* USD Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Amount to Withdraw (USD)
                </label>
                <span className="text-xs text-zinc-400">
                  Available: <span className="font-bold text-emerald-400">${card.balance.toFixed(2)}</span>
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-zinc-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  max={card.balance}
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-16 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setUsdAmount(card.balance.toString())}
                  className="absolute inset-y-1.5 right-2 px-2 text-[10px] font-bold uppercase rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Payout Exchange Rate</span>
                <span>1 USD ≈ {(fxRate - 0.20).toFixed(2)} GHS</span>
              </div>
              <div className="flex justify-between text-zinc-100 font-bold pt-1.5 border-t border-zinc-800">
                <span>Disbursed to MoMo</span>
                <span className="text-emerald-400 font-mono text-sm">GHS {estimatedGhs > 0 ? estimatedGhs.toFixed(2) : '0.00'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || numUsd <= 0 || numUsd > card.balance}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing MoMo Payout...</span>
                </>
              ) : (
                <span>Withdraw ${numUsd.toFixed(2)} USD</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
