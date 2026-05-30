/* TRAX — app shell, routing, state orchestration */

const ROUTES = [
  { group: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard', crumb: 'Overview' }] },
  { group: 'Transactions', items: [
    { key: 'ledger', label: 'Journal Ledger', icon: 'ledger', crumb: 'Transactions' },
    { key: 'accounts', label: 'Chart of Accounts', icon: 'accounts', crumb: 'Transactions' },
  ] },
  { group: 'Reports', items: [
    { key: 'pl', label: 'P&L Statement', icon: 'pl', crumb: 'Reports' },
    { key: 'ie', label: 'Income & Expense', icon: 'ie', crumb: 'Reports' },
    { key: 'bs', label: 'Balance Sheet', icon: 'bs', crumb: 'Reports' },
    { key: 'tb', label: 'Trial Balance', icon: 'tb', crumb: 'Reports' },
  ] },
];
const ROUTE_MAP = {}; ROUTES.forEach(g => g.items.forEach(i => ROUTE_MAP[i.key] = i));

function App() {
  const S = useStore();
  const [route, setRoute] = useState(() => localStorage.getItem('trax_route') || 'dashboard');
  const [entryModal, setEntryModal] = useState(null);   // {editing} or {} for new, or null
  const [acctModal, setAcctModal] = useState(null);
  const [ghModal, setGhModal] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);
  const [sync, setSync] = useState({ state: 'idle' });
  const [ready, setReady] = useState(false);

  const theme = S.prefs.theme || 'dark';
  const currency = S.prefs.currency || 'USD';

  // boot
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    TRAX.load().then(src => { setReady(true); });
    // global save fn
    window.__traxSave = async (msg) => {
      const connected = TRAX.Store.gh && TRAX.Store.gh.token;
      if (connected) setSync({ state: 'syncing' });
      const r = await TRAX.save(msg);
      if (r.committed) { setSync({ state: 'ok' }); toast('Committed to GitHub', 'ok'); }
      else if (r.error) { setSync({ state: 'err' }); toast('Commit failed: ' + r.error.slice(0, 40), 'err'); }
      else setSync({ state: 'idle' });
      setTimeout(() => setSync(s => (s.state === 'ok' ? { state: 'idle' } : s)), 2200);
    };
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('trax_route', route); }, [route]);

  // keyboard
  useEffect(() => {
    const h = e => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setEntryModal({}); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  function go(key) { setRoute(key); setSbOpen(false); window.scrollTo(0, 0); }
  const openEntry = (e) => setEntryModal(e ? { editing: e } : {});
  const openAccount = (a) => setAcctModal(a ? { editing: a } : {});

  const cur = ROUTE_MAP[route] || ROUTE_MAP.dashboard;

  // source pill
  let pillCls = 'github', pillTxt = 'GitHub';
  if (sync.state === 'syncing') { pillCls = 'syncing'; pillTxt = 'Syncing\u2026'; }
  else if (sync.state === 'err') { pillCls = 'err'; pillTxt = 'Sync error'; }
  else if (S.gh && S.gh.token) { pillCls = 'github'; pillTxt = 'GitHub'; }
  else if (S.source === 'seed') { pillCls = 'seed'; pillTxt = 'FINANCE.xlsx'; }
  else { pillCls = 'local'; pillTxt = 'Local copy'; }

  const screenProps = { S: S.data, currency, go, openEntry, openAccount };

  let screen;
  switch (route) {
    case 'ledger': screen = React.createElement(Ledger, screenProps); break;
    case 'accounts': screen = React.createElement(Accounts, screenProps); break;
    case 'pl': screen = React.createElement(PLReport, screenProps); break;
    case 'ie': screen = React.createElement(IEReport, screenProps); break;
    case 'bs': screen = React.createElement(BSReport, screenProps); break;
    case 'tb': screen = React.createElement(TBReport, screenProps); break;
    default: screen = React.createElement(Dashboard, screenProps);
  }

  // Bottom nav items: the 5 most important screens
  const BOTTOM_NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'ledger', label: 'Ledger', icon: 'ledger' },
    { key: 'accounts', label: 'Accounts', icon: 'accounts' },
    { key: 'pl', label: 'P&L', icon: 'pl' },
    { key: 'bs', label: 'Balance', icon: 'bs' },
  ];

  return React.createElement('div', { className: 'app' },
    /* sidebar */
    React.createElement('aside', { className: 'sidebar' + (sbOpen ? ' open' : '') },
      React.createElement('div', { className: 'brand' },
        React.createElement('div', { className: 'brand-mark' }, 'T'),
        React.createElement('div', null,
          React.createElement('div', { className: 'brand-name' }, 'TRAX'),
          React.createElement('div', { className: 'brand-sub' }, 'Kneuralabs Ledger')
        )
      ),
      React.createElement('nav', null,
        ROUTES.map(g => React.createElement(React.Fragment, { key: g.group },
          React.createElement('div', { className: 'nav-group' }, g.group),
          g.items.map(it => React.createElement('button', {
            key: it.key, className: 'nav-item' + (route === it.key ? ' active' : ''), onClick: () => go(it.key),
          }, React.createElement(Icon, { name: it.icon, w: 15 }), it.label))
        ))
      ),
      React.createElement('div', { className: 'sb-foot' },
        React.createElement('span', { className: 'dot', style: { width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)' } }),
        S.data.entries.length + ' entries \u00b7 ' + S.data.accounts.length + ' accts'
      )
    ),
    React.createElement('div', { className: 'scrim' + (sbOpen ? ' show' : ''), onClick: () => setSbOpen(false) }),

    /* main */
    React.createElement('div', { className: 'main' },
      React.createElement('div', { className: 'topbar' },
        React.createElement('button', { className: 'icobtn hamburger', onClick: () => setSbOpen(true) }, React.createElement(Icon, { name: 'menu', w: 16 })),
        React.createElement('div', { className: 'tb-title' },
          React.createElement('div', { className: 'tb-crumb' }, cur.crumb),
          React.createElement('div', { className: 'tb-h1' }, cur.label)
        ),
        React.createElement('div', { className: 'tb-spacer' }),
        React.createElement('div', { className: 'tb-actions' },
          /* currency */
          React.createElement('div', { className: 'seg hide-sm' },
            ['USD', 'INR'].map(c => React.createElement('button', {
              key: c, className: currency === c ? 'on accent' : '', onClick: () => TRAX.setPref('currency', c),
            }, c))
          ),
          /* source pill */
          React.createElement('button', { className: 'pill ' + pillCls, onClick: () => setGhModal(true), title: 'Data source' },
            React.createElement('span', { className: 'dot' }), pillTxt),
          /* theme */
          React.createElement('button', { className: 'icobtn', 'data-tip': theme === 'dark' ? 'Light mode' : 'Dark mode', onClick: () => TRAX.setPref('theme', theme === 'dark' ? 'light' : 'dark') },
            React.createElement(Icon, { name: theme === 'dark' ? 'sun' : 'moon', w: 15 })),
          /* export \u2014 hidden on very small screens */
          React.createElement('button', { className: 'icobtn hide-sm', 'data-tip': 'Export FINANCE.xlsx', onClick: () => { TRAX.exportJSON(); toast('Downloaded FINANCE.xlsx', 'ok'); } },
            React.createElement(Icon, { name: 'download', w: 15 })),
          /* new */
          React.createElement('button', { className: 'btn btn-accent btn-sm', onClick: () => setEntryModal({}) },
            React.createElement(Icon, { name: 'plus', w: 14 }), 'New')
        )
      ),
      React.createElement('div', { className: 'content', key: route, 'data-screen-label': cur.label }, screen)
    ),

    /* bottom nav \u2014 visible only on mobile (< 480px via CSS) */
    React.createElement('nav', { className: 'bottom-nav' },
      React.createElement('div', { className: 'bottom-nav-inner' },
        BOTTOM_NAV.map(it => React.createElement('button', {
          key: it.key, className: 'bn-item' + (route === it.key ? ' active' : ''), onClick: () => go(it.key),
        }, React.createElement(Icon, { name: it.icon, w: 18 }), it.label))
      )
    ),

    /* modals */
    entryModal && React.createElement(EntryModal, { editing: entryModal.editing, onClose: () => setEntryModal(null) }),
    acctModal && React.createElement(AccountModal, { editing: acctModal.editing, onClose: () => setAcctModal(null) }),
    ghModal && React.createElement(GithubModal, { onClose: () => setGhModal(false) }),
    React.createElement(Toast, null)
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
