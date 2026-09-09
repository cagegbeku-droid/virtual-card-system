import React, { useState } from 'react';
import { X, ShoppingCart, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { safeFetch } from '../api';

const PRESET_MERCHANTS = [
  { name: 'AWS Cloud Services', category: 'Infrastructure', amount: 34.20, icon: '☁️' },
  { name: 'GitHub Copilot Enterprise', category: 'Developer Tools', amount: 19.00, icon: '💻' },
  { name: 'OpenAI ChatGPT Plus', category: 'AI Tools', amount: 20.00, icon: '🤖' },
  { name: 'Netflix Premium', category: 'Streaming', amount: 15.99, icon: '🎬' },
  { name: 'DigitalOcean Cloud Droplet', category: 'Infrastructure', amount: 24.00, icon: '🌊' },
  { name: 'Google Cloud Platform', category: 'Infrastructure', amount: 48.50, icon: '🌐' },
];

export default function MerchantSimulatorModal({ card, isOpen, onClose, onSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_MERCHANTS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('Developer Services');
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

    const cardBalance = Number(card?.balance ?? 0);
    if (card?.status === 'FROZEN') {
      setResult({
        success: false,
        status: 'DECLINED',
        decline_reason: 'Card is frozen by cardholder. Unfreeze card to authorize.',
      });
      setLoading(false);
      return;
    }

    if (cardBalance < targetAmount) {
      setResult({
        success: false,
        status: 'DECLINED',
        decline_reason: `Insufficient funds. Balance: $${cardBalance.toFixed(2)}, Requested: $${targetAmount.toFixed(2)}`,
      });
      setLoading(false);
      return;
    }

    const res = await safeFetch('/api/simulator/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card?.id,
        merchant_name: targetMerchant,
        merchant_category: targetCategory,
        amount_usd: targetAmount,
        cvv: cvv ? cvv.trim() : undefined,
      }),
    });

    if (res.ok && res.data) {
      setResult(res.data);
      onSuccess?.();
    } else {
      // Offline fallback simulation
      setResult({
        success: true,
        status: 'APPROVED',
        authorization_code: 'AUTH_' + Math.floor(100000 + Math.random() * 900000),
        amount: targetAmount,
        merchant: targetMerchant,
        message: 'Transaction approved by Visa 3DS network',
      });
      onSuccess?.();
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setResult(null);
    setCvv('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in text-slate-100">
      <div className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-emerald-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Online Payment Sandbox</h3>
            <p className="text-xs text-slate-400 font-mono">
              Simulate international Visa online merchant transactions
            </p>
          </div>
        </div>

        {/* RESULT VIEW */}
        {result ? (
          <div className="py-4 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center border ${
                result.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {result.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                {result.success ? 'Payment Authorized' : 'Payment Declined'}
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {result.success ? result.message || 'Transaction approved by Visa 3DS' : result.decline_reason}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="text-white font-semibold">{targetMerchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold">${targetAmount.toFixed(2)} USD</span>
              </div>
              {result.authorization_code && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Code:</span>
                  <span className="text-slate-300">{result.authorization_code}</span>
                </div>
              )}
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-2 px-4 rounded-md bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d] text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* TRANSACTION FORM */
          <form onSubmit={handleAuthorize} className="space-y-4 text-xs font-mono">
            {/* Merchant Presets */}
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-2">
                Select International Merchant
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_MERCHANTS.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(m);
                      setCustomMode(false);
                    }}
                    className={`p-2.5 rounded-md border text-left transition-colors flex items-center gap-2 ${
                      !customMode && selectedPreset.name === m.name
                        ? 'bg-[#21262d] border-emerald-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <div className="truncate">
                      <p className="font-semibold text-[11px] truncate text-white">{m.name}</p>
                      <p className="text-emerald-400 font-bold text-[10px]">${m.amount.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Balance Bar */}
            <div className="p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs">
              <span className="text-slate-400">Card Balance Available:</span>
              <span className="font-bold text-emerald-400 font-mono">
                ${Number(card?.balance ?? 0).toFixed(2)} USD
              </span>
            </div>

            {/* Authorize Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing 3DS Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize ${targetAmount.toFixed(2)} USD Debit</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
