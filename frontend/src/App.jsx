import React, { useState, useEffect, Component } from 'react';
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
  Lock,
  LogOut,
  User,
  CheckCircle2,
  Server,
  Smartphone,
  Globe,
  FileText,
  Sliders,
} from 'lucide-react';

import { safeFetch } from './api';
import VirtualCard3D from './components/VirtualCard3D';
import MoMoTopupModal from './components/MoMoTopupModal';
import CardControlsModal from './components/CardControlsModal';
import IssueCardModal from './components/IssueCardModal';
import CashoutModal from './components/CashoutModal';
import TransactionLedger from './components/TransactionLedger';
import AuthModal from './components/AuthModal';
import KycModal from './components/KycModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import LegalModal from './components/LegalModal';

// Top-level Error Boundary to eliminate white-screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Render Error caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-[#111827] border border-[#1F2937] rounded-xl text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">System Recovery</h2>
            <p className="text-xs text-slate-400 font-mono">
              An unexpected render exception was caught. Click below to safely reset your session.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('coratech_token');
                window.location.reload();
              }}
              className="py-2 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Reset Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CoratechApp />
    </ErrorBoundary>
  );
}

function CoratechApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coratech_token'));
  const [cards, setCards] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [fxInfo, setFxInfo] = useState({ fx_rate: 11.55, fee_percent: 1.5 });

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showCashout, setShowCashout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('TERMS');

  // Secret admin route trigger (?admin=true or #admin or Ctrl+Shift+A)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.hash === '#admin') {
      setShowAdmin(true);
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdmin((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch FX Rate (defaults to 11.55 GHS)
  useEffect(() => {
    safeFetch('/api/fx-rate').then((res) => {
      if (res.ok && res.data) {
        setFxInfo(res.data);
      }
    });
  }, []);

  const fetchUserData = async () => {
    const currentToken = localStorage.getItem('coratech_token');
    const isDemo = localStorage.getItem('coratech_demo_mode') === 'true';

    if (!currentToken && !isDemo) {
      setCurrentUser(null);
      setCards([]);
      setTransactions([]);
      setStats(null);
      return;
    }

    // 1. Fetch user
    const userRes = await safeFetch('/api/auth/me');
    if (!userRes.ok) {
      if (userRes.status === 401 && !isDemo) {
        localStorage.removeItem('coratech_token');
        setCurrentUser(null);
      }
      return;
    }
    setCurrentUser(userRes.data);

    // 2. Fetch cards
    const cardsRes = await safeFetch('/api/cards');
    if (cardsRes.ok && Array.isArray(cardsRes.data)) {
      setCards(cardsRes.data);
      if (cardsRes.data.length > 0) {
        const cId = activeCardId && cardsRes.data.some((c) => c.id === activeCardId) ? activeCardId : cardsRes.data[0].id;
        setActiveCardId(cId);
        loadCardTransactions(cId);
      } else {
        setActiveCardId(null);
        setTransactions([]);
      }
    }

    // 3. Fetch stats
    const statsRes = await safeFetch('/api/stats');
    if (statsRes.ok && statsRes.data) {
      setStats(statsRes.data);
    }
  };

  const loadCardTransactions = async (cardId) => {
    const res = await safeFetch(`/api/cards/${cardId}/transactions`);
    if (res.ok && Array.isArray(res.data)) {
      setTransactions(res.data);
    }
  };

  const loadCardDetails = async (cardId) => {
    const res = await safeFetch(`/api/cards/${cardId}/reveal`);
    if (res.ok && res.data) setCardDetails(res.data);
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (activeCardId) {
      loadCardTransactions(activeCardId);
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

    setCards((prev) =>
      prev.map((c) => (c.id === activeCard.id ? { ...c, status: newStatus } : c))
    );

    await safeFetch(`/api/cards/${activeCard.id}/controls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('coratech_token');
    localStorage.removeItem('coratech_demo_mode');
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
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      <div>
        {/* CLEAN FINTECH NAVBAR (Mercury / Wise style) */}
        <header className="bg-[#111827] border-b border-[#1F2937] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1F2937] border border-[#374151] flex items-center justify-center text-emerald-400 font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Coratech</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2937] text-slate-300 border border-[#374151]">
                  AfriVisa
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Virtual Visa & Ghana Mobile Money Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Exchange Rate Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-xs font-mono text-slate-300">
              <span className="text-slate-400">Rate:</span>
              <span className="text-emerald-400 font-semibold">1 USD = {fxInfo.fx_rate} GHS</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleOpenIssueCard}
                  className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Card</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#1F2937]">
                  <div className="text-right hidden lg:block text-xs font-mono">
                    <p className="font-semibold text-white">{currentUser.full_name}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.phone_number}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-slate-400 hover:text-rose-400 border border-[#374151] transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuth(true)}
                  className="py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </header>

        {/* KYC Compliance Banner */}
        {currentUser && currentUser.kyc_status !== 'VERIFIED' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-4">
            <div className="p-3.5 rounded-lg bg-[#1c1809] border border-[#3f320b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold block text-white">Identity Verification Required</span>
                  <span className="text-slate-400 text-[11px]">
                    To comply with Bank of Ghana guidelines, please register your Ghana Card before issuing payment cards.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowKyc(true)}
                className="py-1.5 px-3.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors"
              >
                Verify Ghana Card
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
          {!currentUser ? (
            /* CLEAN CONSUMER FINTECH LANDING PAGE (Wise / Mercury style) */
            <div className="py-12 sm:py-20 max-w-3xl mx-auto text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#111827] border border-[#1F2937] text-xs font-mono text-slate-300 mb-6">
                Direct Mobile Money Rails • Visa Platinum USD
              </span>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Virtual Visa cards funded directly via Ghana Mobile Money.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
                Issue 3D-Secure USD Visa debit cards for AWS, GitHub, Netflix, OpenAI, and overseas merchants. Top up instantly with MTN MoMo, Telecel Cash, or AT Money without foreign card declines.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full sm:w-auto py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Get Started with Ghana MoMo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setLegalTab('FEES');
                    setShowLegal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[#111827] hover:bg-[#1F2937] text-slate-300 font-semibold text-xs border border-[#1F2937] transition-colors"
                >
                  View Transparent Fee Schedule
                </button>
              </div>

              {/* 3 Clear Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="w-9 h-9 rounded-lg bg-[#1F2937] flex items-center justify-center text-emerald-400 mb-3 border border-[#374151]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Instant Visa Issuance</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Receive your 16-digit card number, CVV2, and 3DS authentication ready in seconds.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="w-9 h-9 rounded-lg bg-[#1F2937] flex items-center justify-center text-teal-400 mb-3 border border-[#374151]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Direct MoMo Top-Up</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convert GHS to USD via MTN MoMo, Telecel Cash, or AT Money at Bank of Ghana interbank rates.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="w-9 h-9 rounded-lg bg-[#1F2937] flex items-center justify-center text-cyan-400 mb-3 border border-[#374151]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Card Controls & Security</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Freeze or unlock cards instantly, set spending limits, or cash out remaining balances back to MoMo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED BANKING DASHBOARD */
            <div className="space-y-6">
              {/* TOP FINANCIAL METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Card Balance</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${((activeCard?.balance ?? stats?.total_balance_usd) ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ≈ GH₵ {(((activeCard?.balance ?? stats?.total_balance_usd) ?? 0) * fxInfo.fx_rate).toFixed(2)} GHS
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total MoMo Loaded</span>
                    <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${(stats?.total_topup ?? 350.0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Paystack rails</p>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total Spend</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${(stats?.total_spent ?? 67.20).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Online debits</p>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Active Cards</span>
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    {cards.length} Card{cards.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Visa 3DS Active</p>
                </div>
              </div>

              {/* MAIN WORKSPACE SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: PHYSICAL CARD & CONTROLS */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card Selector (if user owns multiple cards) */}
                  {cards.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {cards.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCardId(c.id)}
                          className={`py-1 px-3 rounded-lg text-xs font-mono transition-colors border ${
                            activeCard?.id === c.id
                              ? 'bg-[#1F2937] text-white border-emerald-500'
                              : 'bg-[#111827] text-slate-400 border-[#1F2937] hover:text-white'
                          }`}
                        >
                          {c.cardholder_name} ({c.masked_number.slice(-4)})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Visa Card 3D Display */}
                  <VirtualCard3D
                    card={activeCard}
                    details={cardDetails}
                    revealed={revealed}
                    onToggleReveal={handleToggleReveal}
                    onOpenTopup={() => setShowTopup(true)}
                    onOpenControls={() => setShowControls(true)}
                  />

                  {/* Primary Action Button Toolbar */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <button
                      onClick={() => setShowTopup(true)}
                      className="p-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center transition-colors shadow-sm"
                    >
                      <span>Top Up MoMo</span>
                    </button>

                    <button
                      onClick={handleToggleFreeze}
                      className="p-3 rounded-lg bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-slate-200 text-center transition-colors font-semibold"
                    >
                      <span>{activeCard?.status === 'FROZEN' ? 'Unlock Card' : 'Freeze Card'}</span>
                    </button>

                    <button
                      onClick={() => setShowControls(true)}
                      className="p-3 rounded-lg bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-slate-200 text-center transition-colors font-semibold"
                    >
                      <span>Card Limits</span>
                    </button>
                  </div>

                  {/* Card Telemetry Details */}
                  <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-mono space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Card Status:</span>
                      <span className="text-emerald-400 font-semibold">{activeCard?.status || 'ACTIVE'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Spend Limit:</span>
                      <span className="text-white">
                        ${((activeCard?.spend_limit ?? activeCard?.daily_limit) ?? 1000).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Billing Country:</span>
                      <span className="text-white">Ghana (GH) • Visa 3DS</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: REAL TRANSACTION LEDGER */}
                <div className="lg:col-span-7">
                  <TransactionLedger transactions={transactions} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CLEAN FOOTER (Without Admin Portal Button) */}
      <footer className="mt-16 border-t border-[#1F2937] py-6 text-xs text-slate-500 font-mono bg-[#111827]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Coratech Global. Powered by Paystack Ghana & Neon PostgreSQL.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setLegalTab('TERMS');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('PRIVACY');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('FEES');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Fee Schedule
            </button>
          </div>
        </div>
      </footer>

      {/* SYSTEM MODALS */}
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

      <AdminDashboardModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />

      <LegalModal
        isOpen={showLegal}
        initialTab={legalTab}
        onClose={() => setShowLegal(false)}
      />
    </div>
  );
}
