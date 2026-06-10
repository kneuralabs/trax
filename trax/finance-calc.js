/* ============================================================
   TRAX — pure calculations & formatting
   ============================================================ */
(function () {
  // amount stored in USD + per-entry usdInrRate. Convert per chosen currency.
  function conv(entry, currency) {
    return currency === 'INR' ? entry.amount * (entry.usdInrRate || 84) : entry.amount;
  }
  function symbol(currency) { return currency === 'INR' ? '\u20B9' : '$'; }

  function fmt(n, currency, opts) {
    opts = opts || {};
    const neg = n < 0;
    const abs = Math.abs(n);
    const dec = currency === 'INR' ? (opts.dec != null ? opts.dec : 0) : (opts.dec != null ? opts.dec : 2);
    let s = abs.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    s = symbol(currency) + s;
    if (neg) s = '\u2212' + s; // minus sign
    return s;
  }
  function fmtRaw(entry, currency) { return fmt(conv(entry, currency), currency); }

  /* ---------- period filter ---------- */
  function inPeriod(dateStr, period, refDate) {
    if (period === 'all' || !period) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    const now = refDate || new Date();
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (period === 'quarter') {
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3);
    }
    return true;
  }

  /* ---------- aggregates ---------- */
  function totalsByType(entries, currency) {
    const t = { income: 0, expense: 0, asset: 0, liability: 0, equity: 0 };
    entries.forEach(e => { if (t[e.type] != null) t[e.type] += conv(e, currency); });
    t.net = t.income - t.expense;
    return t;
  }

  /* Single grouping helper.
     Without `accounts`: [{account, amount}] sorted by amount desc (dashboard variant).
     With `accounts`:    [{code, name, amount}] sorted by code (report variant, code lookup). */
  function groupByAccount(entries, type, currency, accounts) {
    const map = {};
    entries.filter(e => e.type === type).forEach(e => {
      const k = accounts ? e.account : (e.account || 'Unassigned');
      map[k] = (map[k] || 0) + conv(e, currency);
    });
    if (accounts) {
      return Object.entries(map).map(([name, amount]) => {
        const acc = accounts.find(a => a.name === name);
        return { code: acc ? acc.code : '', name, amount };
      }).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }
    return Object.entries(map).map(([account, amount]) => ({ account, amount })).sort((a, b) => b.amount - a.amount);
  }
  function byAccount(entries, type, currency) { return groupByAccount(entries, type, currency); }

  // monthly series of {label, income, expense} for last n months
  function monthlySeries(entries, currency, n) {
    n = n || 6;
    const now = new Date();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), income: 0, expense: 0 });
    }
    entries.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date + 'T00:00:00');
      const key = d.getFullYear() + '-' + d.getMonth();
      const row = out.find(o => o.key === key);
      if (row) { if (e.type === 'income') row.income += conv(e, currency); else if (e.type === 'expense') row.expense += conv(e, currency); }
    });
    return out;
  }

  window.CALC = { conv, symbol, fmt, fmtRaw, inPeriod, totalsByType, byAccount, groupByAccount, monthlySeries };
})();
