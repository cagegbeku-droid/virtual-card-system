import React, { useState } from 'react';
import { Snowflake, Copy, Check } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
  themeOverride,
}) {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';
  const theme = themeOverride || card.color_theme || 'titanium';

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number
      ? details.card_number.replace(/\s+/g, '')
      : card.masked_number.replace(/\s+/g, '');
    navigator.clipboard.writeText(panToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPan = revealed && details?.card_number
    ? details.card_number
    : card.masked_number || '4512 7800 1234 5678';
  
  const displayCvv = revealed && details?.cvv ? details.cvv : '***';
  const displayExpiry = `${String(card.expiry_month || 9).padStart(2, '0')}/${String(card.expiry_year || 27).slice(-2)}`;
  const cardholder = card.cardholder_name || 'OLUWASEUN ADESINA';

  // Theme palettes with radial brushed textures and underglow colors
  const THEME_STYLES = {
    titanium: {
      bg: 'radial-gradient(circle at 48% 50%, #2A303F 0%, #151821 45%, #0B0E15 100%)',
      conic: 'conic-gradient(from 45deg at 48% 50%, rgba(255,255,255,0.03) 0deg, rgba(255,255,255,0.22) 40deg, rgba(255,255,255,0.03) 80deg, rgba(34,211,238,0.18) 135deg, rgba(255,255,255,0.03) 180deg, rgba(255,255,255,0.22) 220deg, rgba(255,255,255,0.03) 260deg, rgba(34,211,238,0.15) 315deg, rgba(255,255,255,0.03) 360deg)',
      glowColor: 'rgba(34, 211, 238, 0.55)',
      glowBlur: 'bg-cyan-400/40',
      visaColor: 'text-[#22D3EE]',
      visaDropShadow: 'drop-shadow-[0_0_14px_rgba(34,211,238,0.85)]',
      chipGradient: 'from-cyan-300 via-teal-400 to-cyan-700 border-cyan-200/60',
      chipTrace: 'border-teal-900/60',
      waveColor: 'text-cyan-300/90',
    },
    obsidian: {
      bg: 'radial-gradient(circle at 48% 50%, #1C1F26 0%, #0E1015 45%, #050608 100%)',
      conic: 'conic-gradient(from 45deg at 48% 50%, rgba(255,255,255,0.02) 0deg, rgba(255,255,255,0.15) 45deg, rgba(255,255,255,0.02) 90deg, rgba(255,255,255,0.15) 225deg, rgba(255,255,255,0.02) 360deg)',
      glowColor: 'rgba(34, 211, 238, 0.45)',
      glowBlur: 'bg-cyan-500/30',
      visaColor: 'text-[#22D3EE]',
      visaDropShadow: 'drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]',
      chipGradient: 'from-cyan-200 via-teal-400 to-cyan-600 border-cyan-200/60',
      chipTrace: 'border-teal-900/60',
      waveColor: 'text-cyan-300/90',
    },
    royal_gold: {
      bg: 'radial-gradient(circle at 48% 50%, #3D321D 0%, #21190B 45%, #0F0B05 100%)',
      conic: 'conic-gradient(from 45deg at 48% 50%, rgba(251,191,36,0.05) 0deg, rgba(251,191,36,0.25) 40deg, rgba(251,191,36,0.05) 80deg, rgba(255,255,255,0.2) 135deg, rgba(251,191,36,0.05) 180deg, rgba(251,191,36,0.25) 220deg, rgba(251,191,36,0.05) 260deg, rgba(255,255,255,0.18) 315deg, rgba(251,191,36,0.05) 360deg)',
      glowColor: 'rgba(251, 191, 36, 0.45)',
      glowBlur: 'bg-amber-400/35',
      visaColor: 'text-amber-300',
      visaDropShadow: 'drop-shadow-[0_0_14px_rgba(251,191,36,0.85)]',
      chipGradient: 'from-amber-200 via-yellow-400 to-amber-700 border-amber-200/60',
      chipTrace: 'border-amber-950/60',
      waveColor: 'text-amber-300/90',
    },
    emerald: {
      bg: 'radial-gradient(circle at 48% 50%, #153229 0%, #0B1C16 45%, #050E0B 100%)',
      conic: 'conic-gradient(from 45deg at 48% 50%, rgba(52,211,153,0.04) 0deg, rgba(52,211,153,0.22) 40deg, rgba(52,211,153,0.04) 80deg, rgba(34,211,238,0.15) 135deg, rgba(52,211,153,0.04) 180deg, rgba(52,211,153,0.22) 220deg, rgba(52,211,153,0.04) 260deg, rgba(34,211,238,0.15) 315deg, rgba(52,211,153,0.04) 360deg)',
      glowColor: 'rgba(52, 211, 153, 0.5)',
      glowBlur: 'bg-emerald-400/35',
      visaColor: 'text-emerald-300',
      visaDropShadow: 'drop-shadow-[0_0_14px_rgba(52,211,153,0.85)]',
      chipGradient: 'from-emerald-200 via-teal-400 to-emerald-700 border-emerald-200/60',
      chipTrace: 'border-emerald-950/60',
      waveColor: 'text-emerald-300/90',
    },
    violet: {
      bg: 'radial-gradient(circle at 48% 50%, #2E1B4E 0%, #170E28 45%, #0B0614 100%)',
      conic: 'conic-gradient(from 45deg at 48% 50%, rgba(192,132,252,0.04) 0deg, rgba(192,132,252,0.22) 40deg, rgba(192,132,252,0.04) 80deg, rgba(34,211,238,0.18) 135deg, rgba(192,132,252,0.04) 180deg, rgba(192,132,252,0.22) 220deg, rgba(192,132,252,0.04) 260deg, rgba(34,211,238,0.15) 315deg, rgba(192,132,252,0.04) 360deg)',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      glowBlur: 'bg-purple-500/40',
      visaColor: 'text-purple-300',
      visaDropShadow: 'drop-shadow-[0_0_14px_rgba(192,132,252,0.85)]',
      chipGradient: 'from-purple-200 via-violet-400 to-purple-700 border-purple-200/60',
      chipTrace: 'border-purple-950/60',
      waveColor: 'text-purple-300/90',
    },
  };

  const currentStyle = THEME_STYLES[theme] || THEME_STYLES.titanium;

  return (
    <div className="relative w-full max-w-[450px] select-none mx-auto group">
      {/* VIBRANT AMBIENT NEON UNDERGLOW (Matching the Image) */}
      <div
        className={`absolute -bottom-5 left-1/2 -translate-x-1/2 w-4/5 h-10 ${currentStyle.glowBlur} blur-2xl rounded-full pointer-events-none transition-all duration-500`}
      />

      {/* CARD BODY: BRUSHED TITANIUM WITH RADIAL & CONIC SHEEN */}
      <div
        className="relative w-full h-[260px] sm:h-[268px] rounded-2xl p-6 sm:p-7 text-white overflow-hidden shadow-2xl border border-white/15 transition-all duration-300"
        style={{
          background: currentStyle.bg,
          boxShadow: `0 22px 50px -10px ${currentStyle.glowColor}, 0 0 0 1px rgba(255, 255, 255, 0.12) inset`,
        }}
      >
        {/* Repeating Concentric Circular Micro-Grooves (Brushed Steel Effect) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at 48% 50%, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)`,
          }}
        />

        {/* Conic Light Reflection Spokes (Radial Brushed Glare) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45 mix-blend-color-dodge"
          style={{
            background: currentStyle.conic,
          }}
        />

        {/* Top Edge Gradient Rim Light */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/40 via-cyan-400/80 to-transparent pointer-events-none" />

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-[#070A12]/92 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-slate-200">
            <div className="p-3 bg-slate-800/90 rounded-full mb-2 border border-slate-700 shadow-lg">
              <Snowflake className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase font-mono text-cyan-300">
              Card Frozen
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Authorizations blocked</span>
          </div>
        )}

        {/* TOP ROW: AFRIVISA | GLOBAL VIRTUAL CARD & VISA LOGO */}
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] sm:text-xs tracking-[0.16em] text-white uppercase font-mono">
              AFRIVISA
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.14em] text-slate-300 uppercase font-mono">
              GLOBAL VIRTUAL CARD
            </span>
          </div>

          <div className="relative flex items-center">
            <span
              className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${currentStyle.visaColor} ${currentStyle.visaDropShadow}`}
              style={{ fontFamily: 'sans-serif' }}
            >
              VISA
            </span>
          </div>
        </div>

        {/* MIDDLE-LEFT: EMV SMART CHIP & CONTACTLESS WAVE */}
        <div className="flex items-center gap-3.5 mt-5 sm:mt-6 z-10 relative">
          {/* Smart EMV Chip with Circuit Traces */}
          <div
            className={`w-12 h-9 rounded-md bg-gradient-to-br ${currentStyle.chipGradient} p-0.5 shadow-md border flex flex-col justify-around px-1 relative overflow-hidden`}
          >
            <div className={`h-[1px] ${currentStyle.chipTrace} w-full`} />
            <div className="flex justify-between">
              <div className={`w-2.5 h-2.5 border ${currentStyle.chipTrace} rounded-xs`} />
              <div className={`w-2.5 h-2.5 border ${currentStyle.chipTrace} rounded-xs`} />
            </div>
            <div className={`h-[1px] ${currentStyle.chipTrace} w-full`} />
            {/* Chip Holographic Specular Glint */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
          </div>

          {/* Contactless waves ))) */}
          <div className="flex items-center gap-0.5">
            <svg
              className={`w-5 h-5 ${currentStyle.waveColor}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>
          </div>
        </div>

        {/* 16-DIGIT CARD NUMBER (EMBOSSED MONOSPACE) */}
        <div className="mt-4 sm:mt-5 z-10 relative flex items-center justify-between group/num">
          <p
            className="font-mono text-xl sm:text-[22px] tracking-[0.2em] text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(255,255,255,0.4)' }}
          >
            {displayPan}
          </p>
          <button
            onClick={handleCopyNumber}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
            title="Copy Card Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* BOTTOM DETAILS: EXPIRY, CARDHOLDER NAME & CVV WITH PILL TOGGLE SWITCH */}
        <div className="mt-3 sm:mt-4 z-10 relative flex items-end justify-between font-mono">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">EXP</span>
              <span className="text-white font-bold text-xs">{displayExpiry}</span>
            </div>
            <span className="block text-white font-bold text-xs sm:text-[13px] uppercase tracking-wider mt-1 drop-shadow-sm">
              {cardholder}
            </span>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">CVV</span>
            <div className="flex items-center gap-2.5">
              <span className="text-white font-bold tracking-widest text-xs min-w-[28px] text-right">
                {displayCvv}
              </span>
              {/* Sleek Pill Toggle Switch matching Image: [  O] */}
              <button
                type="button"
                onClick={onToggleReveal}
                className={`w-9 h-5 rounded-full transition-all relative flex items-center px-0.5 border shadow-inner ${
                  revealed
                    ? 'bg-cyan-500/40 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                    : 'bg-slate-800/90 border-slate-600'
                }`}
                title={revealed ? 'Hide CVV' : 'Reveal CVV'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-200 ${
                    revealed ? 'translate-x-4 bg-cyan-300' : 'translate-x-0 bg-white/90'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
