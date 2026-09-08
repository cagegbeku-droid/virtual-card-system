import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Shield,
  ShieldAlert,
  Snowflake,
  DollarSign,
  Zap,
  Lock,
  LogOut,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import VirtualCard3D from './components/VirtualCard3D';
import MoMoTopupModal from './components/MoMoTopupModal';
import CardControlsModal from './components/CardControlsModal';
import IssueCardModal from './components/IssueCardModal';
import CashoutModal from './components/CashoutModal';
import TransactionLedger from './components/TransactionLedger';
import AuthModal from './components/AuthModal';
import KycModal from './components/KycModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coratech_token'));
  const [cards, setCards] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [fxInfo, setFxInfo] = useState({ fx_rate: 15.50, fee_percent: 1.5 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showCashout, setShowCashout] = useState(false);

  // Fetch FX info
  useEffect(() => {
    fetch('/api/fx-rate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFxInfo(d))
      .catch((e) => console.error(e));
  }, []);

  // Fetch user and cards when token changes
  const fetchUserData = async () => {
    const currentToken = localStorage.getItem('coratech_token');
    if (!currentToken) {
      setCurrentUser(null);
      setCards([]);
      setTransactions([]);
      setStats(null);
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${currentToken}` };

    try {
      // 1. Fetch current user
      const userRes = await fetch('/api/auth/me', { headers });
      if (!userRes.ok) {
        // Expired or invalid token
        localStorage.removeItem('coratech_token');
        setCurrentUser(null);
        setCards([]);
        setLoading(false);
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData);

      // 2. Fetch user's cards
      const cardsRes = await fetch('/api/cards', { headers });
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData);
        if (cardsData.length > 0) {
          const cId = activeCardId && cardsData.some((c) => c.id === activeCardId) ? activeCardId : cardsData[0].id;
          setActiveCardId(cId);
          loadCardTransactions(cId, currentToken);
        } else {
          setActiveCardId(null);
          setTransactions([]);
        }
      }

      // 3. Fetch user stats
      const statsRes = await fetch('/api/stats', { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCardTransactions = async (cardId, authToken) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/transactions`, {
        headers: { Authorization: `Bearer ${authToken || token}` },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadCardDetails = async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/reveal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCardDetails(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (activeCardId && token) {
      loadCardTransactions(activeCardId, token);
      if (revealed) loadCardDetails(activeCardId);
    }
  }, [activeCardId]);

  const handleToggleReveal = async () => {
    if (!revealed) {
      if (activeCardId) await loadCardDetails(activeCardId);
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!activeCard) return;
    const newStatus = activeCard.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    try {
      const res = await fetch(`/api/cards/${activeCard.id}/controls`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchUserData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coratech_token');
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setTransactions([]);
  };

  const handleOpenIssueCard = () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (currentUser.kyc_status !== 'VERIFIED') {
      setShowKyc(true);
      return;
    }
    setShowIssue(true);
  };

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 selection:bg-emerald-500 selection:text-slate-950 pb-16">
      {/* Background ambient light */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/75 border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Coratech</span>
                <span className="text-emerald-400 font-extrabold">AfriVisa</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                Paystack MoMo Rail
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Virtual Visa Cards powered by Coratech Global</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-400">Live FX:</span>
            <span className="font-mono font-bold text-emerald-400">1 USD = {fxInfo.fx_rate} GHS</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenIssueCard}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Card</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">{currentUser.full_name}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">{currentUser.phone_number}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* KYC Alert Banner if unverified */}
      {currentUser && currentUser.kyc_status !== 'VERIFIED' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block text-white">Identity Verification Required</span>
                <span>To comply with Bank of Ghana guidelines, please verify your Ghana Card to issue virtual cards.</span>
              </div>
            </div>
            <button
              onClick={() => setShowKyc(true)}
              className="py-1.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold tracking-wide transition-all self-start sm:self-auto shrink-0 shadow-sm"
            >
              Verify Ghana Card
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {!currentUser ? (
          /* GUEST / LOGGED-OUT MARKETING LANDING */
          <div className="py-12 sm:py-20 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Ghana MoMo Settlement • Visa Platinum</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Virtual Visa Cards for Global Payments, Funded by MoMo.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-8 leading-relaxed">
              Never get declined on Netflix, OpenAI, AWS, Google Ads, or Spotify again. Generate a secure, 3DS-ready virtual Visa card in seconds and top up directly from MTN MoMo, Telecel Cash, or AT Money.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                <span>Get Your Virtual Visa Card</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED USER DASHBOARD */
          <>
            {/* STATS STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Available Balance</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  ${stats ? stats.total_balance_usd.toFixed(2) : '0.00'}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  ≈ GHS {stats ? (stats.total_balance_usd * fxInfo.fx_rate).toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Total MoMo Loaded</span>
                  <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  ${stats ? stats.total_topups_usd.toFixed(2) : '0.00'}
                </p>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Zap className="w-3 h-3" />
                  <span>Instant Paystack Rail</span>
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Total Card Spend</span>
                  <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  ${stats ? stats.total_spend_usd.toFixed(2) : '0.00'}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Visa Online Purchases</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Active Cards</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  {stats ? stats.active_cards : '0'} <span className="text-xs text-zinc-400 font-normal">/ {stats ? stats.total_cards : '0'}</span>
                </p>
                <p className="text-[10px] text-amber-300 mt-1">Luhn Valid • 3DS Ready</p>
              </div>
            </div>

            {/* IF USER HAS NO CARDS */}
            {cards.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto border border-zinc-800">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center mb-4 border border-emerald-500/20">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Virtual Cards Issued Yet</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Request your first virtual Visa card now. You can choose a custom color theme, set limits, and immediately fund it using Mobile Money.
                </p>
                <button
                  onClick={handleOpenIssueCard}
                  className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue My First Virtual Visa Card</span>
                </button>
              </div>
            ) : (
              /* CARD VIEW & LEDGER */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: 3D CARD & ACTIONS */}
                <div className="lg:col-span-5 space-y-6">
                  {cards.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {cards.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCardId(c.id)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                            activeCard?.id === c.id
                              ? 'bg-zinc-800 text-white border-emerald-500 shadow-sm'
                              : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/80 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{c.cardholder_name} ({c.masked_number.slice(-4)})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <VirtualCard3D
                    card={activeCard}
                    details={cardDetails}
                    revealed={revealed}
                    onToggleReveal={handleToggleReveal}
                    onOpenTopup={() => setShowTopup(true)}
                    onOpenControls={() => setShowControls(true)}
                    onOpenSimulator={() => setShowTopup(true)}
                  />

                  {/* QUICK ACTIONS */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowTopup(true)}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white">Top Up with MoMo</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">MTN, Telecel, AT Money</p>
                    </button>

                    <button
                      onClick={() => setShowControls(true)}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Shield className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white">Security Controls</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Limits, channels & PIN</p>
                    </button>

                    <button
                      onClick={handleToggleFreeze}
                      className={`p-3.5 rounded-2xl border transition-all text-left group ${
                        activeCard?.status === 'FROZEN'
                          ? 'bg-sky-950/50 border-sky-400/50'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                          activeCard?.status === 'FROZEN' ? 'bg-sky-500/20 text-sky-300' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {activeCard?.status === 'FROZEN' ? <Snowflake className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <p className="text-xs font-bold text-white">
                        {activeCard?.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Instant lock protection</p>
                    </button>

                    <button
                      onClick={() => setShowCashout(true)}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white">Withdraw to MoMo</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Sweep USD back to Ghana</p>
                    </button>
                  </div>

                  {/* Billing Details */}
                  <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Billing Address:</span>
                      <span className="text-white font-medium truncate max-w-[200px] text-right">{activeCard?.billing_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Postal Code:</span>
                      <span className="font-mono text-zinc-200">{activeCard?.postal_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Daily Spend Limit:</span>
                      <span className="font-mono text-emerald-400">${activeCard?.daily_limit.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: LEDGER */}
                <div className="lg:col-span-7">
                  <TransactionLedger transactions={transactions} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={(u, t) => {
          setToken(t);
          setCurrentUser(u);
          fetchUserData();
        }}
      />

      <KycModal
        isOpen={showKyc}
        onClose={() => setShowKyc(false)}
        onSuccess={() => fetchUserData()}
      />

      <MoMoTopupModal
        card={activeCard}
        fxRate={fxInfo.fx_rate}
        feePercent={fxInfo.fee_percent}
        isOpen={showTopup}
        onClose={() => setShowTopup(false)}
        onSuccess={() => fetchUserData()}
      />

      <CardControlsModal
        card={activeCard}
        details={cardDetails}
        isOpen={showControls}
        onClose={() => setShowControls(false)}
        onUpdated={() => fetchUserData()}
        onTerminated={() => fetchUserData()}
      />

      <IssueCardModal
        isOpen={showIssue}
        onClose={() => setShowIssue(false)}
        onSuccess={() => fetchUserData()}
      />

      <CashoutModal
        card={activeCard}
        fxRate={fxInfo.fx_rate}
        isOpen={showCashout}
        onClose={() => setShowCashout(false)}
        onSuccess={() => fetchUserData()}
      />
    </div>
  );
}
