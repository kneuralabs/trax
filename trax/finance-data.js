/* ============================================================
   TRAX — Finance data layer
   Reads from / writes to FINANCE.xlsx (which is JSON on disk).
   Sources, in priority order:
     1. GitHub repo file (live, if a token is connected)  — read + commit
     2. Bundled FINANCE.xlsx next to this page             — seed read
     3. localStorage                                       — offline working cache
   ============================================================ */
(function () {
  const LS_DATA = 'trax_data_v1';
  const LS_GH = 'trax_gh_v1';
  const LS_PREFS = 'trax_prefs_v1';
  const FINANCE_FILE = 'FINANCE.xlsx'; // JSON payload, kept for repo compatibility

  const DEFAULT_ACCOUNTS = [
    { id: 1, name: 'Sales Revenue', type: 'income', code: '4001' },
    { id: 2, name: 'Service Revenue', type: 'income', code: '4002' },
    { id: 3, name: 'Other Income', type: 'income', code: '4003' },
    { id: 4, name: 'Cost of Goods Sold', type: 'expense', code: '5001' },
    { id: 5, name: 'Salaries & Wages', type: 'expense', code: '5002' },
    { id: 6, name: 'Rent', type: 'expense', code: '5003' },
    { id: 7, name: 'Utilities', type: 'expense', code: '5004' },
    { id: 8, name: 'Marketing & Advertising', type: 'expense', code: '5005' },
    { id: 9, name: 'Office Supplies', type: 'expense', code: '5006' },
    { id: 10, name: 'Cash', type: 'asset', code: '1001' },
    { id: 11, name: 'Bank Account', type: 'asset', code: '1002' },
    { id: 12, name: 'Accounts Receivable', type: 'asset', code: '1003' },
    { id: 13, name: 'Fixed Assets', type: 'asset', code: '1004' },
    { id: 14, name: 'Accounts Payable', type: 'liability', code: '2001' },
    { id: 15, name: 'Loans Payable', type: 'liability', code: '2002' },
    { id: 16, name: 'Owner Equity', type: 'equity', code: '3001' },
    { id: 17, name: 'Retained Earnings', type: 'equity', code: '3002' },
  ];

  const TYPES = ['income', 'expense', 'asset', 'liability', 'equity'];

  const Store = {
    data: { entries: [], accounts: DEFAULT_ACCOUNTS.slice(), nextId: 1, paidByList: [], paidToList: [] },
    gh: null,           // {token, owner, repo, path, branch, sha}
    prefs: { theme: 'dark', currency: 'USD' },
    source: 'seed',     // 'github' | 'seed' | 'local'
    listeners: [],
  };

  /* ---------- pub/sub ---------- */
  function subscribe(fn) { Store.listeners.push(fn); return () => { Store.listeners = Store.listeners.filter(f => f !== fn); }; }
  function emit() { Store.listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

  /* ---------- normalization ---------- */
  function normalize(raw) {
    const d = raw || {};
    const accounts = Array.isArray(d.accounts) && d.accounts.length ? d.accounts.map(a => ({
      id: Number(a.id), name: String(a.name || ''), type: String(a.type || 'expense').toLowerCase(), code: String(a.code || ''),
    })) : DEFAULT_ACCOUNTS.slice();
    const entries = (Array.isArray(d.entries) ? d.entries : []).map(e => ({
      id: Number(e.id),
      txnId: e.txnId || ('TXN-' + String(e.id).padStart(6, '0')),
      date: e.date || '',
      type: String(e.type || 'expense').toLowerCase(),
      account: e.account || '',
      desc: e.desc || e.description || '',
      amount: Number(e.amount) || 0,
      paidBy: e.paidBy || '',
      paidTo: e.paidTo || '',
      usdInrRate: Number(e.usdInrRate) || 84,
      ref: e.ref || e.reference || '',
      notes: e.notes || '',
    }));
    return {
      entries,
      accounts,
      nextId: Number(d.nextId) || (entries.reduce((m, e) => Math.max(m, e.id), 0) + 1),
      paidByList: Array.isArray(d.paidByList) ? d.paidByList : [],
      paidToList: Array.isArray(d.paidToList) ? d.paidToList : [],
    };
  }

  function serialize() {
    // Exact shape compatible with the existing repo file.
    return JSON.stringify({
      entries: Store.data.entries.map(e => ({
        id: e.id, txnId: e.txnId, date: e.date, type: e.type, account: e.account,
        desc: e.desc, amount: e.amount, paidBy: e.paidBy, paidTo: e.paidTo,
        usdInrRate: e.usdInrRate, ref: e.ref, notes: e.notes,
      })),
      accounts: Store.data.accounts.map(a => ({ id: a.id, name: a.name, type: a.type, code: a.code })),
      nextId: Store.data.nextId,
      paidByList: Store.data.paidByList,
      paidToList: Store.data.paidToList,
    }, null, 2);
  }

  /* ---------- GitHub helpers ---------- */
  function parseGhUrl(url) {
    // https://github.com/owner/repo/blob/branch/path/to/file
    try {
      const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
      if (m) return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
      const r = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (r) return { owner: r[1], repo: r[2], branch: 'main', path: FINANCE_FILE };
    } catch (e) {}
    return null;
  }

  async function ghGet(gh) {
    const url = `https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${encodeURIComponent(gh.path).replace(/%2F/g, '/')}?ref=${gh.branch}`;
    const r = await fetch(url, { headers: { Authorization: `token ${gh.token}`, Accept: 'application/vnd.github.v3+json' } });
    if (!r.ok) throw new Error('GET ' + r.status);
    const j = await r.json();
    const content = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
    return { sha: j.sha, content };
  }

  async function ghPut(gh, content, msg) {
    const url = `https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${encodeURIComponent(gh.path).replace(/%2F/g, '/')}`;
    const body = { message: msg || 'Update FINANCE data via Trax', content: btoa(unescape(encodeURIComponent(content))), branch: gh.branch };
    if (gh.sha) body.sha = gh.sha;
    const r = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `token ${gh.token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const t = await r.text(); throw new Error('PUT ' + r.status + ' ' + t); }
    const j = await r.json();
    return j.content && j.content.sha;
  }

  /* ---------- load / save ---------- */
  async function load() {
    // prefs + gh config from localStorage
    try { const p = JSON.parse(localStorage.getItem(LS_PREFS)); if (p) Object.assign(Store.prefs, p); } catch (e) {}
    try { const g = JSON.parse(localStorage.getItem(LS_GH)); if (g && g.token) Store.gh = g; } catch (e) {}

    // 1. GitHub (live) if connected
    if (Store.gh && Store.gh.token) {
      try {
        const { sha, content } = await ghGet(Store.gh);
        Store.gh.sha = sha;
        Store.data = normalize(JSON.parse(content));
        Store.source = 'github';
        persistLocal();
        emit();
        return Store.source;
      } catch (e) { console.warn('GitHub load failed, falling back', e); }
    }
    // 2. localStorage working copy
    try {
      const local = JSON.parse(localStorage.getItem(LS_DATA));
      if (local && Array.isArray(local.entries)) { Store.data = normalize(local); Store.source = 'local'; emit(); return Store.source; }
    } catch (e) {}
    // 3. bundled FINANCE.xlsx seed (live file)
    try {
      const r = await fetch(FINANCE_FILE + '?t=' + Date.now());
      if (r.ok) {
        const txt = await r.text();
        const j = JSON.parse(txt); // throws on non-JSON (e.g. blocked preview)
        Store.data = normalize(j); Store.source = 'seed'; persistLocal(); emit(); return Store.source;
      }
    } catch (e) { console.warn('live seed unavailable, using inline snapshot', e); }
    // 4. inline seed snapshot (always present)
    if (window.TRAX_SEED) { Store.data = normalize(window.TRAX_SEED); Store.source = 'seed'; persistLocal(); emit(); return Store.source; }
    emit();
    return Store.source;
  }

  function persistLocal() {
    try { localStorage.setItem(LS_DATA, serialize()); } catch (e) {}
  }

  // save returns {ok, committed, error}
  async function save(msg) {
    persistLocal();
    if (Store.gh && Store.gh.token) {
      try {
        const newSha = await ghPut(Store.gh, serialize(), msg);
        if (newSha) Store.gh.sha = newSha;
        localStorage.setItem(LS_GH, JSON.stringify(Store.gh));
        return { ok: true, committed: true };
      } catch (e) {
        return { ok: false, committed: false, error: String(e.message || e) };
      }
    }
    return { ok: true, committed: false };
  }

  /* ---------- mutations ---------- */
  function genTxnId(id) { return 'TXN-' + String(id).padStart(6, '0'); }

  function addEntry(entry) {
    const id = Store.data.nextId;
    const e = Object.assign({ id, txnId: genTxnId(id), usdInrRate: 84 }, entry);
    Store.data.entries.push(e);
    Store.data.nextId = id + 1;
    rememberParty(e.paidBy, 'paidByList');
    rememberParty(e.paidTo, 'paidToList');
    emit();
    return e;
  }
  function updateEntry(id, patch) {
    const e = Store.data.entries.find(x => x.id === id);
    if (e) { Object.assign(e, patch); rememberParty(e.paidBy, 'paidByList'); rememberParty(e.paidTo, 'paidToList'); emit(); }
    return e;
  }
  function deleteEntry(id) { Store.data.entries = Store.data.entries.filter(x => x.id !== id); emit(); }

  function rememberParty(name, listKey) {
    name = (name || '').trim();
    if (name && !Store.data[listKey].includes(name)) Store.data[listKey].push(name);
  }

  function addAccount(acc) {
    const id = Date.now();
    const a = Object.assign({ id, code: '' }, acc);
    Store.data.accounts.push(a); emit(); return a;
  }
  function updateAccount(id, patch) { const a = Store.data.accounts.find(x => x.id === id); if (a) { Object.assign(a, patch); emit(); } return a; }
  function deleteAccount(id) { Store.data.accounts = Store.data.accounts.filter(x => x.id !== id); emit(); }

  function nextAccountCode(type) {
    const prefix = { income: '4', expense: '5', asset: '1', liability: '2', equity: '3' }[type] || '6';
    const codes = Store.data.accounts.filter(a => a.type === type).map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
    const base = parseInt(prefix + '000', 10);
    const max = codes.length ? Math.max(...codes) : base;
    return String(max + 1);
  }

  /* ---------- GitHub connect ---------- */
  async function connectGithub(token, url) {
    const parsed = parseGhUrl(url);
    if (!parsed) throw new Error('Could not parse GitHub URL');
    const gh = Object.assign({ token }, parsed);
    const { sha, content } = await ghGet(gh); // validates token + reads
    gh.sha = sha;
    Store.gh = gh;
    Store.data = normalize(JSON.parse(content));
    Store.source = 'github';
    localStorage.setItem(LS_GH, JSON.stringify(gh));
    persistLocal();
    emit();
    return Store.source;
  }
  function disconnectGithub() { Store.gh = null; localStorage.removeItem(LS_GH); emit(); }

  /* ---------- prefs ---------- */
  function setPref(key, val) { Store.prefs[key] = val; localStorage.setItem(LS_PREFS, JSON.stringify(Store.prefs)); emit(); }

  /* ---------- exports ---------- */
  function exportJSON() {
    const blob = new Blob([serialize()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'FINANCE.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
  }
  async function importJSON(file) {
    const text = await file.text();
    Store.data = normalize(JSON.parse(text));
    Store.source = 'local';
    persistLocal(); emit();
  }

  window.TRAX = {
    Store, TYPES, DEFAULT_ACCOUNTS,
    subscribe, emit, load, save, persistLocal,
    addEntry, updateEntry, deleteEntry,
    addAccount, updateAccount, deleteAccount, nextAccountCode,
    connectGithub, disconnectGithub, parseGhUrl,
    setPref, exportJSON, importJSON, serialize, genTxnId,
  };
})();
