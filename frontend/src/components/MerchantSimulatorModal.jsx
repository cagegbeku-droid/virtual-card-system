import React, { useState } from 'react';
import { X, ShoppingCart, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

const PRESET_MERCHANTS = [
  { name: 'Netflix Premium', category: 'Streaming', amount: 15.99, icon: '🎬' },
  { name: 'OpenAI ChatGPT Plus', category: 'AI Tools', amount: 20.00, icon: '🤖' },
  { name: 'Amazon Prime Store', category: 'Ecommerce', amount: 48.50, icon: '🛒' },
  { name: 'Spotify Family', category: 'Music', amount: 16.99, icon: '🎵' },
  { name: 'Uber Ride & Eats', category: 'Transport', amount: 12.40, icon: '🚕' },
  { name: 'AWS Cloud Services', category: 'Infrastructure', amount: 34.20, icon: '☁️' },
];

export default function MerchantSimulatorModal({ card, isOpen, onClose, onSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_MERCHANTS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('Online Shopping');
  const [amount, setAmount] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const targetMerchant = customMode ? merchantName : selectedPreset.name;
  const targetCategory = customMode ? category : selectedPreset.category;
  const targetAmount = customMode ? parseFloat(amount) || 0 : selectedPreset.amount;

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/simulator/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          merchant_name: targetMerchant,
          merchant_category: targetCategory,
          amount_usd: targetAmount,
          cvv: cvv ? cvv.trim() : undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
      if (data.success) {
        onSuccess?.();
      }
    } catch (err) {
      setResult({
        success: false,
        status: 'ERROR',
        decline_reason: 'Network connection failure or timeout',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setResult(null);
    setCvv('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-100">
        {/* Header Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {result ? (
          /* RESULT SCREEN */
          <div className="flex flex-col items-center text-center py-6 animate-scale-up">
            {result.success ? (
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                <XCircle className="w-10 h-10" />
              </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-1">
              {result.success ? 'Payment Approved!' : 'Transaction Declined'}
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              {result.success
                ? `Visa authorization code generated for ${result.merchant_name}`
                : result.decline_reason}
            </p>

            <div className="w-full bg-zinc-950/70 rounded-2xl p-4 border border-zinc-800 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Merchant</span>
                <span className="font-semibold text-white">{result.merchant_name || targetMerchant}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Amount Billed</span>
                <span className="font-bold text-white">${result.amount ? result.amount.toFixed(2) : targetAmount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Status</span>
                <span className={`font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.status}
                </span>
              </div>
              {result.reference && (
                <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800">
                  <span>Visa Authorization Ref</span>
                  <span className="font-mono text-[11px] text-zinc-300">{result.reference}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-all"
            >
              Test Another Payment
            </button>
          </div>
        ) : (
          /* PAYMENT TERMINAL FORM */
          <form onSubmit={handleAuthorize} className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl font-bold text-white">Merchant Payment Simulator</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Simulate online checkout using Visa card ending in <span className="font-mono text-zinc-300 font-semibold">{card?.masked_number?.slice(-4)}</span>
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-zinc-950/80 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !customMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Popular Merchants
              </button>
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  customMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Custom Merchant
              </button>
            </div>

            {!customMode ? (
              /* Preset Cards */
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {PRESET_MERCHANTS.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedPreset(m)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedPreset.name === m.name
                        ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-950/40'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5 py-0.5 bg-zinc-800 rounded">
                        {m.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                      <p className="text-sm font-bold text-indigo-300 mt-0.5">${m.amount.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Merchant Inputs */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Merchant Name</label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Adobe Creative Cloud"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25.00"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* CVV Confirmation Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-400">
                  Card CVV Security Code (Optional Simulation)
                </label>
                <span className="text-[10px] text-zinc-500">Leave blank to auto-pass</span>
              </div>
              <input
                type="password"
                maxLength={3}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="3-digit CVV"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Card Balance Check Reminder */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
              <span className="text-zinc-400">Current Card Balance:</span>
              <span className="font-bold text-emerald-400">${card?.balance?.toFixed(2)} USD</span>
            </div>

            {/* Authorize Button */}
            <button
              type="submit"
              disabled={loading || targetAmount <= 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing via Visa Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize Payment of ${targetAmount.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
