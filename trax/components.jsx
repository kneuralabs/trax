/* TRAX — shared components, icons, hooks */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- icons ---------- */
const PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  ledger: '<path d="M4 4h13l3 3v13a0 0 0 0 1 0 0H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  accounts: '<path d="M3 9h18M9 21V9"/><rect x="3" y="4" width="18" height="17" rx="2"/>',
  pl: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
  ie: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  bs: '<path d="M12 3v18M3 7l9-4 9 4M5 7v6a4 4 0 0 0 4 0V7M15 7v6a4 4 0 0 0 4 0V7M4 21h16"/>',
  tb: '<path d="M3 4h18v4H3zM3 12h8v8H3zM13 12h8v8h-8z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.5 5.5L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5z"/>',
};
function Icon({ name, w }) {
  return React.createElement('svg', {
    width: w || 16, height: w || 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'ic',
    dangerouslySetInnerHTML: { __html: PATHS[name] || '' },
  });
}

/* ---------- store hook ---------- */
function useStore() {
  const [, force] = useState(0);
  useEffect(() => TRAX.subscribe(() => force(v => v + 1)), []);
  return TRAX.Store;
}

/* ---------- toast ---------- */
function toast(msg, kind) { window.dispatchEvent(new CustomEvent('trax-toast', { detail: { msg, kind: kind || '' } })); }
function Toast() {
  const [t, setT] = useState(null);
  useEffect(() => {
    let timer;
    const h = e => { setT(e.detail); clearTimeout(timer); timer = setTimeout(() => setT(null), 2600); };
    window.addEventListener('trax-toast', h);
    return () => { window.removeEventListener('trax-toast', h); clearTimeout(timer); };
  }, []);
  return React.createElement('div', { className: 'toast ' + (t ? 'show ' + (t.kind || '') : '') },
    React.createElement('span', { className: 'dot' }),
    React.createElement('span', null, t ? t.msg : '')
  );
}

/* ---------- type badge ---------- */
function TypeBadge({ type }) {
  return React.createElement('span', { className: 'tb-badge ' + type },
    React.createElement('span', { className: 'd' }), type
  );
}

/* ---------- empty ---------- */
function Empty({ label, sub }) {
  return React.createElement('div', { className: 'empty' },
    React.createElement(Icon, { name: 'inbox', w: 30 }),
    React.createElement('p', null, label || 'Nothing here yet'),
    sub && React.createElement('div', { className: 'micro' }, sub)
  );
}

/* ---------- monthly bar chart ---------- */
function BarChart({ series, currency }) {
  const max = Math.max(1, ...series.map(s => Math.max(s.income, s.expense)));
  return React.createElement('div', null,
    React.createElement('div', { className: 'chart-bars' },
      series.map((s, i) => React.createElement('div', { className: 'cb-col', key: i },
        React.createElement('div', { className: 'cb-stack' },
          React.createElement('div', { className: 'cb-seg exp', style: { height: (s.expense / max * 100) + '%' }, title: 'Expense ' + CALC.fmt(s.expense, currency) }),
          s.income > 0 && React.createElement('div', { className: 'cb-seg inc', style: { height: (s.income / max * 100) + '%' }, title: 'Income ' + CALC.fmt(s.income, currency) })
        ),
        React.createElement('div', { className: 'cb-label' }, s.label)
      ))
    ),
    React.createElement('div', { className: 'legend', style: { marginTop: '12px' } },
      React.createElement('span', null, React.createElement('i', { style: { background: 'var(--pos)' } }), 'Income'),
      React.createElement('span', null, React.createElement('i', { style: { background: 'var(--neg)' } }), 'Expense')
    )
  );
}

/* ---------- category bars ---------- */
function CatBars({ rows, currency, color }) {
  const max = Math.max(1, ...rows.map(r => Math.abs(r.amount)));
  if (!rows.length) return React.createElement(Empty, { label: 'No data for this period' });
  return React.createElement('div', { className: 'catbar' },
    rows.slice(0, 7).map((r, i) => React.createElement('div', { className: 'catrow', key: i },
      React.createElement('span', { className: 'cn' }, r.account),
      React.createElement('span', { className: 'cv num' }, CALC.fmt(r.amount, currency)),
      React.createElement('div', { className: 'cattrack' },
        React.createElement('div', { className: 'catfill', style: { width: (Math.abs(r.amount) / max * 100) + '%', background: color || 'var(--neg)' } })
      )
    ))
  );
}

/* ---------- cash register digit roller ---------- */
function RollDigits({ text }) {
  return React.createElement(React.Fragment, null,
    text.split('').map((ch, i) => {
      if (!/[0-9]/.test(ch)) return React.createElement('span', { key: i }, ch);
      return React.createElement('span', { key: i, className: 'digit-col' },
        React.createElement('span', {
          className: 'digit-col-inner',
          style: { animationDelay: (i * 40) + 'ms' }
        }, ch)
      );
    })
  );
}

Object.assign(window, { Icon, useStore, toast, Toast, TypeBadge, Empty, BarChart, CatBars, RollDigits });
