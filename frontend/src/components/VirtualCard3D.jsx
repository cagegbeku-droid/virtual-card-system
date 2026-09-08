import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Copy, Check, Lock, Snowflake, Sparkles, Wifi } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
  onOpenTopup,
  onOpenControls,
  onOpenSimulator,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number ? details.card_number.replace(/\s+/g, '') : card.masked_number.replace(/\s+/g, '');
    navigator.clipboard.writeText(panToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color theme styles
  const themeStyles = {
    cyber_neon: 'from-slate-950 via-indigo-950 to-cyan-950 text-cyan-100 border-cyan-400/60 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-400/30',
    obsidian: 'from-zinc-900 via-neutral-900 to-black text-white border-zinc-700/60 shadow-2xl shadow-black/80',
    royal_gold: 'from-amber-950 via-yellow-950 to-stone-900 text-amber-100 border-amber-500/40 shadow-2xl shadow-amber-950/50',
    emerald: 'from-emerald-950 via-teal-950 to-slate-950 text-emerald-100 border-emerald-500/40 shadow-2xl shadow-emerald-950/50',
  };

  const currentTheme = themeStyles[card.color_theme] || themeStyles.cyber_neon;

  // Display PAN
  const displayPan = revealed && details?.card_number ? details.card_number : card.masked_number;
  const displayCvv = revealed && details?.cvv ? details.cvv : '•••';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 3D Card Container */}
      <div
        className="w-full h-64 perspective-1000 cursor-pointer select-none relative group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`w-full h-full relative duration-700 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br ${currentTheme} border backface-hidden overflow-hidden flex flex-col justify-between`}
          >
            {/* Background Texture & Sheen */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Frozen Overlay */}
            {isFrozen && (
              <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-sky-200 border-2 border-sky-400/40 rounded-2xl animate-fade-in">
                <div className="p-3 bg-sky-500/20 rounded-full mb-2">
                  <Snowflake className="w-8 h-8 text-sky-300 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <span className="font-bold tracking-widest text-sm uppercase">Card Temporarily Frozen</span>
                <span className="text-xs text-sky-300/80 mt-0.5">Authorizations are blocked</span>
              </div>
            )}

            {/* Top Bar: Chip, Contactless, Visa Logo */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {/* Metallic Gold Chip */}
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 p-0.5 shadow-md shadow-amber-900/40 border border-yellow-200/50 flex flex-col justify-around px-1.5">
                  <div className="h-[1px] bg-amber-800/40 w-full" />
                  <div className="flex justify-between">
                    <div className="w-2.5 h-3 border border-amber-800/50 rounded-xs" />
                    <div className="w-2.5 h-3 border border-amber-800/50 rounded-xs" />
                  </div>
                  <div className="h-[1px] bg-amber-800/40 w-full" />
                </div>
                {/* Contactless Wave */}
                <Wifi className="w-5 h-5 text-zinc-400 rotate-90" />
              </div>

              {/* Visa Logo Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
                  VISA
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-1 py-0.5 bg-white/10 rounded">
                  PLATINUM
                </span>
              </div>
            </div>

            {/* Middle: Card Number (PAN) */}
            <div className="z-10 my-auto">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xl sm:text-2xl tracking-[0.2em] font-medium drop-shadow-md">
                  {displayPan}
                </p>
                <button
                  onClick={handleCopyNumber}
                  className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-md transition-colors"
                  title="Copy Card Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
                  {copied ? 'Copied to clipboard!' : 'Click to flip card'}
                </span>
              </div>
            </div>

            {/* Bottom: Cardholder Name, Expiry, Currency */}
            <div className="flex items-end justify-between z-10">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Cardholder</p>
                <p className="font-medium tracking-wide text-sm drop-shadow-sm uppercase">
                  {card.cardholder_name}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Expires</p>
                <p className="font-mono text-sm tracking-wider font-medium">
                  {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Balance</p>
                <p className="font-bold text-base text-emerald-400 drop-shadow-sm">
                  ${card.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${currentTheme} border backface-hidden rotate-y-180 overflow-hidden flex flex-col justify-between py-6`}
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-10 bg-zinc-950/90 shadow-inner mt-2 border-y border-zinc-800" />

            {/* Signature Strip & CVV */}
            <div className="px-6 flex items-center justify-between">
              <div className="flex-1 h-9 bg-zinc-200/90 rounded-sm flex items-center justify-between px-3 text-zinc-800 font-mono text-xs shadow-inner">
                <span className="italic text-[10px] text-zinc-500 select-none">Authorized Signature</span>
                <span className="font-bold tracking-widest text-sm bg-zinc-900 text-white px-2 py-0.5 rounded">
                  {displayCvv}
                </span>
              </div>
              <div className="ml-3 text-[10px] text-zinc-400 font-mono text-right">
                CVV2
              </div>
            </div>

            {/* Security Notice & Hologram */}
            <div className="px-6 flex items-center justify-between text-[8px] text-zinc-400 leading-tight">
              <p className="max-w-[240px]">
                This virtual Visa card is issued for authorized electronic internet transactions. International usage subject to limits.
              </p>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-amber-300 opacity-70 blur-[0.5px] border border-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar Below Card */}
      <div className="flex items-center justify-between w-full mt-4 px-2 gap-2">
        <button
          onClick={onToggleReveal}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 transition-all shadow-sm"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5 text-zinc-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{revealed ? 'Hide Details' : 'Reveal Details'}</span>
        </button>

        <button
          onClick={onOpenTopup}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all"
        >
          <span>Top Up MoMo</span>
        </button>

        <button
          onClick={onOpenSimulator}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/30 transition-all shadow-sm"
        >
          <span>Pay / Test</span>
        </button>

        <button
          onClick={onOpenControls}
          className="p-2 text-xs font-medium rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all"
          title="Card Settings & Controls"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
