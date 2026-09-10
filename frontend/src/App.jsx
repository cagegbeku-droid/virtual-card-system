import React, { useState, useEffect, Component } from 'react';
import {
  CreditCard,
  Plus,
  ArrowRight,
  Shield,
  ShieldAlert,
  Snowflake,
  DollarSign,
  Lock,
  LogOut,
  User,
  CheckCircle2,
  Smartphone,
  Search,
  Bell,
  Settings,
  Share2,
  MoreHorizontal,
  ChevronDown,
  LayoutDashboard,
  Users,
  ArrowLeftRight,
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

// Defensive Error Boundary to guarantee no blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Render Error caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A10] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-[#0E131F] border border-[#1C2438] rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Interface Reload</h2>
            <p className="text-xs text-slate-400 font-mono">
              Click below to refresh the workspace.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('coratech_token');
                window.location.reload();
              }}
              className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Reload Workspace
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
      <AfriVisaApp />
    </ErrorBoundary>
  );
}

function AfriVisaApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coratech_token'));
  const [cards, setCards] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [fxInfo, setFxInfo] = useState({ fx_rate: 11.55, fee_percent: 1.5 });
  const [activeNav, setActiveNav] = useState('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Navigation
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('REGISTER');
  const [showKyc, setShowKyc] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [topupPresetNetwork, setTopupPresetNetwork] = useState('MTN');
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

  // Fetch Bank of Ghana FX Rate (11.55 GHS)
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

    // 1. Fetch user profile
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

  const handleOpenAuth = (mode = 'REGISTER') => {
    setAuthInitialMode(mode);
    setShowAuth(true);
  };

  const handleOpenIssueCard = () => {
    if (!currentUser) {
      handleOpenAuth('REGISTER');
      return;
    }
    if (currentUser.kyc_status !== 'VERIFIED') {
      setShowKyc(true);
      return;
    }
    setShowIssue(true);
  };

  const handleOpenMoMo = (net = 'MTN') => {
    if (!currentUser) {
      handleOpenAuth('REGISTER');
      return;
    }
    setTopupPresetNetwork(net);
    setShowTopup(true);
  };

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0] || {
    id: 'demo-card-1',
    masked_number: '4512 7800 1234 5678',
    cardholder_name: currentUser?.full_name?.toUpperCase() || 'OLUWASEUN ADESINA',
    expiry_month: 9,
    expiry_year: 27,
    balance: 0.00,
    status: 'ACTIVE',
    color_theme: 'titanium',
  };

  // Format dynamic date (e.g., "Current date | 10 Sep 2026")
  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-x-hidden font-sans"
      style={{
        backgroundImage: `radial-gradient(#151D2F 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div>
        {!currentUser ? (
          /* ========================================================================= */
          /* GUEST VIEW: TOP NAVBAR WITH SIGN IN / GET STARTED + HERO PREVIEW           */
          /* ========================================================================= */
          <div>
            {/* Top Guest Navigation Header */}
            <header className="border-b border-[#161F32] bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo with A Shield */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold tracking-tight text-white">AfriVisa</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">Global</span>
                  </div>
                </div>

                {/* Right Actions: Sign In & Get Started */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setLegalTab('FEES');
                      setShowLegal(true);
                    }}
                    className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    Rate: 1 USD = {fxInfo.fx_rate} GHS
                  </button>

                  <button
                    onClick={() => handleOpenAuth('SIGN_IN')}
                    className="py-2 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-[#121826] font-semibold text-xs transition-colors border border-transparent hover:border-[#1E293F]"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => handleOpenAuth('REGISTER')}
                    className="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Zero Monthly Maintenance • 15 GHS Card Issuance</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
                Global Virtual Visa Cards funded directly via Mobile Money.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
                Instant 3D-Secure USD Visa cards for international subscriptions, software tools, and cloud platforms. Fund instantly with MTN MoMo, Telecel Cash, or AT Money.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
                <button
                  onClick={() => handleOpenAuth('REGISTER')}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  <span>Get Started (Create Account)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenAuth('SIGN_IN')}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-[#0E131F] hover:bg-[#151D2E] text-slate-200 font-semibold text-xs border border-[#1E293F] transition-colors"
                >
                  Sign In to Dashboard
                </button>
              </div>

              {/* Brushed Titanium Card Mockup Preview */}
              <div className="max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                <VirtualCard3D
                  card={activeCard}
                  details={cardDetails}
                  revealed={revealed}
                  onToggleReveal={handleToggleReveal}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* AUTHENTICATED APP SHELL: AFRIVISA DASHBOARD (MATCHING IMAGE EXACTLY)       */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row min-h-screen">
            {/* 1. LEFT SIDEBAR */}
            <aside className="w-full lg:w-64 bg-[#090D16]/95 border-b lg:border-b-0 lg:border-r border-[#192236] p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                {/* Brand Logo with A Shield */}
                <div className="flex items-center gap-2.5 px-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold text-white tracking-tight">AfriVisa</span>
                </div>

                {/* Profile Pill */}
                <div className="p-2.5 rounded-xl bg-[#0E131F] border border-[#192236] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] text-slate-400 font-mono">Profile</p>
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser?.full_name || 'Oluwaseun A.'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-1.5 font-mono text-xs">
                  <button
                    onClick={() => setActiveNav('DASHBOARD')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      activeNav === 'DASHBOARD'
                        ? 'bg-[#151D2F] text-white font-bold border-l-2 border-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-[#0E131F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      <span>Dashboard</span>
                    </div>
                    {activeNav === 'DASHBOARD' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
                    )}
                  </button>

                  <button
                    onClick={handleOpenIssueCard}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0E131F] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4" />
                      <span>Virtual Cards</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      15 GHS
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveNav('TRANSACTIONS')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      activeNav === 'TRANSACTIONS'
                        ? 'bg-[#151D2F] text-white font-bold border-l-2 border-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-[#0E131F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Transactions</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenMoMo('MTN')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0E131F] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4" />
                      <span>Recipient</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7]" />
                  </button>

                  <button
                    onClick={() => setShowControls(true)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0E131F] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Bottom Profile / Sign Out */}
              <div className="pt-4 border-t border-[#192236] flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="text-xs text-slate-300 truncate font-mono">
                    {currentUser?.full_name || 'Oluwaseun A.'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#0E131F] rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </aside>

            {/* 2. MAIN APP CONTENT AREA */}
            <main className="flex-1 p-4 sm:p-7 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
              {/* Top Bar (Date | Search | Icons) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="text-xs font-mono text-slate-400">
                  Current date | <span className="text-slate-200 font-semibold">{currentDateFormatted}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search transactions or cards"
                      className="w-full bg-[#0E131F] border border-[#192236] rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Icon Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenIssueCard()}
                      className="p-2 rounded-xl bg-[#0E131F] border border-[#192236] text-slate-300 hover:text-white hover:bg-[#151D2F] transition-colors"
                      title="Request New Card (15 GHS)"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                    </button>
                    <button
                      className="p-2 rounded-xl bg-[#0E131F] border border-[#192236] text-slate-300 hover:text-white hover:bg-[#151D2F] transition-colors relative"
                      title="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5 shadow-[0_0_6px_#F59E0B]" />
                    </button>
                    <button
                      onClick={() => setShowControls(true)}
                      className="p-2 rounded-xl bg-[#0E131F] border border-[#192236] text-slate-300 hover:text-white hover:bg-[#151D2F] transition-colors"
                      title="Card Controls & Security"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* KYC Compliance Notification Banner */}
              {currentUser?.kyc_status !== 'VERIFIED' && (
                <div className="p-3.5 rounded-xl bg-[#1C1809] border border-[#3F320B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-semibold block text-white font-mono">
                        Tier-1 Identity Verification Required
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Please register your Ghana Card to comply with Bank of Ghana cross-border payment limits.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKyc(true)}
                    className="py-1 px-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors font-mono"
                  >
                    Verify Ghana Card
                  </button>
                </div>
              )}

              {/* MIDDLE ROW: CARD & RIGHT WIDGETS (Matching Image) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Center / Left: The Radial Brushed Titanium Visa Card */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center">
                  <VirtualCard3D
                    card={activeCard}
                    details={cardDetails}
                    revealed={revealed}
                    onToggleReveal={handleToggleReveal}
                  />

                  {/* Card Quick Actions Bar */}
                  <div className="flex items-center gap-2.5 mt-5 w-full max-w-[450px] text-xs font-mono">
                    <button
                      onClick={handleToggleFreeze}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0E131F] hover:bg-[#151D2E] border border-[#1E293F] text-slate-300 font-semibold transition-colors text-center"
                    >
                      {activeCard?.status === 'FROZEN' ? 'Unlock Card' : 'Freeze Card'}
                    </button>
                    <button
                      onClick={() => setShowControls(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0E131F] hover:bg-[#151D2E] border border-[#1E293F] text-slate-300 font-semibold transition-colors text-center"
                    >
                      Card Limits
                    </button>
                    <button
                      onClick={() => setShowCashout(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0E131F] hover:bg-[#151D2E] border border-[#1E293F] text-slate-300 font-semibold transition-colors text-center"
                    >
                      Sweep to MoMo
                    </button>
                  </div>
                </div>

                {/* Right Column: Card Balance + Quick Top-Up (Matching Image) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card Balance Card */}
                  <div className="p-5 rounded-2xl bg-[#0E131F] border border-[#192236] shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                      <span>Card Balance</span>
                      <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white" />
                    </div>

                    <div className="my-2">
                      <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                        ${Number(activeCard?.balance ?? stats?.total_balance_usd ?? 0.0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span>Current Balance</span>
                      <span className="font-bold text-slate-200">USD</span>
                    </div>
                  </div>

                  {/* Quick Top-Up Card (MTN MoMo, Telecel Cash, and AT Money) */}
                  <div className="p-5 rounded-2xl bg-[#0E131F] border border-[#192236] shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 tracking-wide">Quick Top-Up</span>
                      <span className="text-[10px] font-mono text-slate-400">1 USD = {fxInfo.fx_rate} GHS</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* MTN MoMo Button */}
                      <div className="p-2.5 rounded-xl bg-[#131929] border border-[#1F293F] flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="w-6 h-6 rounded-md bg-yellow-400 text-slate-950 font-bold flex items-center justify-center text-[9px] shadow-sm shrink-0">
                            MTN
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-white leading-tight truncate">MTN</p>
                            <p className="text-[9px] text-slate-400 truncate">MoMo</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenMoMo('MTN')}
                          className="w-full py-1.5 rounded-lg bg-[#1D263B] hover:bg-yellow-400 hover:text-slate-950 text-slate-200 text-[10px] font-semibold font-mono transition-colors text-center"
                        >
                          Top Up
                        </button>
                      </div>

                      {/* Telecel Cash Button */}
                      <div className="p-2.5 rounded-xl bg-[#131929] border border-[#1F293F] flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="w-6 h-6 rounded-md bg-red-600 text-white font-bold flex items-center justify-center text-[10px] shadow-sm shrink-0">
                            t
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-white leading-tight truncate">Telecel</p>
                            <p className="text-[9px] text-slate-400 truncate">Cash</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenMoMo('TELECEL')}
                          className="w-full py-1.5 rounded-lg bg-[#1D263B] hover:bg-red-600 hover:text-white text-slate-200 text-[10px] font-semibold font-mono transition-colors text-center"
                        >
                          Top Up
                        </button>
                      </div>

                      {/* AT Money Button */}
                      <div className="p-2.5 rounded-xl bg-[#131929] border border-[#1F293F] flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-red-600 text-white font-bold flex items-center justify-center text-[9px] shadow-sm shrink-0">
                            AT
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-white leading-tight truncate">AT</p>
                            <p className="text-[9px] text-slate-400 truncate">Money</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenMoMo('AT')}
                          className="w-full py-1.5 rounded-lg bg-[#1D263B] hover:bg-blue-600 hover:text-white text-slate-200 text-[10px] font-semibold font-mono transition-colors text-center"
                        >
                          Top Up
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: PRODUCTION-READY RECENT TRANSACTIONS (NO DUMMY / MOCK DATA) */}
              <div className="p-5 rounded-2xl bg-[#0E131F] border border-[#192236] shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 tracking-wide uppercase font-mono">
                    RECENT TRANSACTIONS
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">Paystack & Visa Network Rails</span>
                </div>

                {/* Real Live Transactions List or Clean Empty State */}
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-2 font-mono text-xs">
                    {transactions.slice(0, 8).map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-[#111624] border border-[#1A2234] flex items-center justify-between hover:bg-[#151B2C] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.merchant_name || 'Card Transaction'}</p>
                            <p className="text-[11px] text-slate-400">
                              ${Number(tx.amount || 0).toFixed(2)} USD • {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.status === 'SUCCESS'
                              ? 'text-emerald-400 border border-emerald-500/40 bg-emerald-500/10'
                              : 'text-amber-400 border border-amber-500/40 bg-amber-500/10'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-2 border border-dashed border-[#1C2438] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300 font-mono">No Recent Transactions</p>
                    <p className="text-[11px] text-slate-500 font-mono max-w-sm mx-auto">
                      Transactions made with your AfriVisa virtual card or mobile money wallet loads will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#192236] py-5 px-6 text-xs text-slate-500 font-mono bg-[#090D16]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AfriVisa by Coratech Global. Bank of Ghana compliant Paystack rails.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setLegalTab('TERMS');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Terms
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('PRIVACY');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('FEES');
                setShowLegal(true);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Fees
            </button>
          </div>
        </div>
      </footer>

      {/* SYSTEM MODALS */}
      <AuthModal
        isOpen={showAuth}
        initialMode={authInitialMode}
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
        defaultName={currentUser?.full_name || ''}
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
