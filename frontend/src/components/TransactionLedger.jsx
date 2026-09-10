import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, XCircle, CheckCircle, Receipt, X, Download } from 'lucide-react';

export default function TransactionLedger({ transactions = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const safeList = Array.isArray(transactions) ? transactions : [];

  const filtered = safeList.filter((tx) => {
    const txType = tx?.type || 'PURCHASE';
    const txStatus = tx?.status || 'APPROVED';

    if (filter === 'TOPUP' && txType !== 'TOPUP' && txType !== 'CREDIT') return false;
    if (filter === 'PURCHASE' && txType !== 'PURCHASE' && txType !== 'DEBIT') return false;
    if (filter === 'DECLINED' && txStatus !== 'DECLINED') return false;

    if (search) {
      const q = search.toLowerCase();
      const mName = (tx?.merchant_name || '').toLowerCase();
      const ref = (tx?.reference || '').toLowerCase();
      const cat = (tx?.merchant_category || tx?.category || '').toLowerCase();
      return mName.includes(q) || ref.includes(q) || cat.includes(q);
    }
    return true;
  });

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString || 'Recent';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString || 'Recent';
    }
  };

  return (
    <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Activity & Settlement Ledger</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-slate-300 border border-[#30363d]">
              {filtered.length} events
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            MoMo wallet deposits & Visa online merchant debits
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TOPUP', label: 'MoMo Inflows' },
            { id: 'PURCHASE', label: 'Visa Debits' },
            { id: 'DECLINED', label: 'Declined' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-[#21262d] text-slate-300 hover:text-white border border-[#30363d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative my-3">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by merchant, reference ID, or category..."
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-8 pr-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Ledger Rows */}
      <div className="divide-y divide-[#30363d] max-h-96 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Receipt className="w-7 h-7 mx-auto mb-2 opacity-50 text-slate-400" />
            <p>No transaction records found matching filter criteria.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isTopup = tx?.type === 'TOPUP' || tx?.type === 'CREDIT';
            const isDeclined = tx?.status === 'DECLINED';
            const usdAmount = Number(tx?.amount ?? tx?.amount_usd ?? 0);
            const ghsAmount = Number(tx?.local_amount ?? tx?.amount_ghs ?? 0);

            return (
              <div
                key={tx.id || Math.random()}
                onClick={() => setSelectedTx(tx)}
                className="py-3 px-2 hover:bg-[#21262d]/50 transition-colors cursor-pointer flex items-center justify-between group rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
                      isDeclined
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : isTopup
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isDeclined ? (
                      <XCircle className="w-4 h-4" />
                    ) : isTopup ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {tx.merchant_name || 'Online Merchant'}
                      </span>
                      {isDeclined && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          DECLINED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                      <span>{tx.merchant_category || tx.category || 'General'}</span>
                      <span>•</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-mono font-bold block ${
                      isDeclined
                        ? 'text-slate-500 line-through'
                        : isTopup
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {isTopup ? `+$${usdAmount.toFixed(2)}` : `-$${usdAmount.toFixed(2)}`} USD
                  </span>
                  {ghsAmount > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ≈ GH₵ {ghsAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in text-slate-100">
          <div className="relative w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-2xl text-xs font-mono">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#21262d]"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-sans font-bold text-white text-sm mb-3">Transaction Receipt</h4>
            <div className="space-y-2 py-3 border-y border-[#30363d]">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant</span>
                <span className="text-white font-semibold">{selectedTx.merchant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount (USD)</span>
                <span className="text-emerald-400 font-bold">
                  ${Number(selectedTx.amount ?? selectedTx.amount_usd ?? 0).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount (GHS)</span>
                <span className="text-slate-300">
                  GH₵ {Number(selectedTx.local_amount ?? selectedTx.amount_ghs ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-white">{selectedTx.status || 'APPROVED'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category</span>
                <span className="text-slate-300">{selectedTx.merchant_category || selectedTx.category || 'Online'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp</span>
                <span className="text-slate-300">{formatDate(selectedTx.created_at)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full mt-4 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d] text-xs font-sans font-medium"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
