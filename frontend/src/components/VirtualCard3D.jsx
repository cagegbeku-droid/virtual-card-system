import React, { useState, useRef } from 'react';
import { Snowflake, Copy, Check } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
  themeOverride,
}) {
  const [copied, setCopied] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';

  // Interactive 3D mouse tilt handlers
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-12 to +12 deg)
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotX(rotateX);
    setRotY(rotateY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number
      ? details.card_number.replace(/\s+/g, '')
      : (card.masked_number || '').replace(/\s+/g, '');
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

  return (
    <div
      className="relative w-full max-w-[440px] select-none mx-auto perspective-[1000px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* RADIANT GOLD AMBIENT UNDERGLOW (Requested: blue glow changed to Gold) */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-amber-500/40 blur-2xl rounded-full pointer-events-none transition-all duration-300"
        style={{
          boxShadow: '0 20px 50px rgba(245, 158, 11, 0.45)',
        }}
      />

      {/* 3D TILT CONTAINER */}
      <div
        ref={cardRef}
        className="relative w-full h-[260px] sm:h-[268px] rounded-2xl p-6 sm:p-7 text-white overflow-hidden border border-white/20 transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          background: 'radial-gradient(circle at 48% 50%, #292E3D 0%, #151822 50%, #090C12 100%)',
          boxShadow: '0 25px 50px -10px rgba(245, 158, 11, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
        }}
      >
        {/* Dynamic Specular Gloss Glare tracking cursor */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.28) 0%, transparent 60%)`,
            opacity: glarePos.opacity,
          }}
        />

        {/* Concentric Circular Brushed Titanium Grooves */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at 48% 50%, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)`,
          }}
        />

        {/* Conic Specular Metallic Sheen Rays with subtle warm gold tint */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge"
          style={{
            background:
              'conic-gradient(from 45deg at 48% 50%, rgba(255,255,255,0.03) 0deg, rgba(255,255,255,0.22) 40deg, rgba(255,255,255,0.03) 80deg, rgba(251,191,36,0.18) 135deg, rgba(255,255,255,0.03) 180deg, rgba(255,255,255,0.22) 220deg, rgba(255,255,255,0.03) 260deg, rgba(251,191,36,0.16) 315deg, rgba(255,255,255,0.03) 360deg)',
          }}
        />

        {/* Top Edge Metallic Rim Light */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-400/40 via-white/70 to-transparent pointer-events-none" />

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-[#070A12]/92 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-slate-200">
            <div className="p-3 bg-slate-800/90 rounded-full mb-2 border border-slate-700 shadow-lg">
              <Snowflake className="w-6 h-6 text-amber-400" />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase font-mono text-amber-300">
              Card Frozen
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Authorizations blocked</span>
          </div>
        )}

        {/* TOP ROW: BRAND & WHITISH VISA LOGO */}
        <div
          className="flex items-center justify-between z-10 relative"
          style={{ transform: 'translateZ(18px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] sm:text-xs tracking-[0.16em] text-white uppercase font-mono">
              AFRIVISA
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.14em] text-slate-300 uppercase font-mono">
              GLOBAL VIRTUAL CARD
            </span>
          </div>

          {/* WHITISH VISA TEXT LOGO (Requested: "visa test should be whitish") */}
          <div className="relative flex items-center">
            <span
              className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]"
              style={{
                fontFamily: 'sans-serif',
                textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              VISA
            </span>
          </div>
        </div>

        {/* MIDDLE: SMART EMV CHIP & CONTACTLESS WAVES */}
        <div
          className="flex items-center gap-3.5 mt-5 sm:mt-6 z-10 relative"
          style={{ transform: 'translateZ(24px)' }}
        >
          {/* Smart EMV Chip with Metallic Circuit Lines */}
          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-700 p-0.5 shadow-md border border-amber-200/60 flex flex-col justify-around px-1 relative overflow-hidden">
            <div className="h-[1px] bg-amber-950/60 w-full" />
            <div className="flex justify-between">
              <div className="w-2.5 h-2.5 border border-amber-950/60 rounded-xs" />
              <div className="w-2.5 h-2.5 border border-amber-950/60 rounded-xs" />
            </div>
            <div className="h-[1px] bg-amber-950/60 w-full" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
          </div>

          {/* Contactless waves ))) */}
          <svg
            className="w-5 h-5 text-amber-200/90"
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

        {/* 16-DIGIT CARD NUMBER (EMBOSSED MONOSPACE 3D) */}
        <div
          className="mt-4 sm:mt-5 z-10 relative flex items-center justify-between"
          style={{ transform: 'translateZ(26px)' }}
        >
          <p
            className="font-mono text-xl sm:text-[22px] tracking-[0.2em] text-white font-semibold"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(255,255,255,0.4)',
            }}
          >
            {displayPan}
          </p>
          <button
            onClick={handleCopyNumber}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Copy Card Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* BOTTOM ROW: EXPIRY, CARDHOLDER & CVV TOGGLE */}
        <div
          className="mt-3 sm:mt-4 z-10 relative flex items-end justify-between font-mono"
          style={{ transform: 'translateZ(20px)' }}
        >
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
              {/* Sleek Pill Toggle Switch */}
              <button
                type="button"
                onClick={onToggleReveal}
                className={`w-9 h-5 rounded-full transition-all relative flex items-center px-0.5 border shadow-inner ${
                  revealed
                    ? 'bg-amber-500/40 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-800/90 border-slate-600'
                }`}
                title={revealed ? 'Hide CVV' : 'Reveal CVV'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-200 ${
                    revealed ? 'translate-x-4 bg-amber-300' : 'translate-x-0 bg-white/90'
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
