/* TRAX — reports: P&L, Income & Expense, Balance Sheet, Trial Balance */
const COMPANY = 'KNEURALABS';

function periodLabel(p) {
  const now = new Date();
  if (p === 'year') return 'Year to date \u00b7 ' + now.getFullYear();
  if (p === 'quarter') return 'Q' + (Math.floor(now.getMonth() / 3) + 1) + ' ' + now.getFullYear();
  if (p === 'month') return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return 'All Time';
}

function ReportShell({ title, period, setPeriod, children, docRef }) {
  return React.createElement('div', { className: 'page' },
    React.createElement('div', { className: 'row-between', style: { marginBottom: '14px' } },
      React.createElement('div', { className: 'periods' },
        ['all', 'year', 'quarter', 'month'].map(p =>
          React.createElement('button', { key: p, className: period === p ? 'on' : '', onClick: () => setPeriod(p) },
            ({ all: 'All', year: 'YTD', quarter: 'Quarter', month: 'Month' })[p]))
      ),
      React.createElement('button', { className: 'btn btn-sm btn-ghost', onClick: () => window.print() },
        React.createElement(Icon, { name: 'print', w: 14 }), 'Print / PDF')
    ),
    React.createElement('div', { className: 'panel rpt-doc', ref: docRef },
      React.createElement('div', { className: 'rpt-head' },
        React.createElement('div', { className: 'rpt-co' }, COMPANY),
        React.createElement('div', { className: 'rpt-title' }, title),
        React.createElement('div', { className: 'rpt-period' }, periodLabel(period))
      ),
      children
    )
  );
}

function RSec({ kind, children, right }) {
  return React.createElement('div', { className: 'rpt-sec ' + (kind || '') },
    React.createElement('span', { className: 'bar' }), children,
    right && React.createElement('span', { style: { marginLeft: 'auto', fontFamily: 'var(--mono)' } }, right));
}
function RLine({ code, label, value, cls, currency }) {
  return React.createElement('div', { className: 'rpt-line ' + (cls || '') },
    React.createElement('span', null, code && React.createElement('span', { className: 'lcode' }, code), label),
    React.createElement('span', { className: 'lv' },
      typeof value === 'string'
        ? React.createElement(FlipBoard, { text: value, epoch: currency || 0 })
        : value));
}

function periodEntries(S, period) { return S.entries.filter(e => CALC.inPeriod(e.date, period)); }

/* group entries by account within a type, returning [{code,name,amount}] */
function groupByAccount(entries, S, type, currency) {
  const map = {};
  entries.filter(e => e.type === type).forEach(e => { map[e.account] = (map[e.account] || 0) + CALC.conv(e, currency); });
  return Object.entries(map).map(([name, amount]) => {
    const acc = S.accounts.find(a => a.name === name);
    return { code: acc ? acc.code : '', name, amount };
  }).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
}

/* ============ P&L ============ */
function PLReport({ S, currency }) {
  const [period, setPeriod] = useState('all');
  const ent = periodEntries(S, period);
  const inc = groupByAccount(ent, S, 'income', currency);
  const exp = groupByAccount(ent, S, 'expense', currency);
  const totInc = inc.reduce((s, r) => s + r.amount, 0);
  const totExp = exp.reduce((s, r) => s + r.amount, 0);
  const net = totInc - totExp;
  return React.createElement(ReportShell, { title: 'Profit & Loss Statement', period, setPeriod },
    React.createElement(RSec, { kind: 'inc' }, 'Revenue'),
    inc.length ? inc.map((r, i) => React.createElement(RLine, { key: i, code: r.code, label: r.name, value: CALC.fmt(r.amount, currency), currency }))
      : React.createElement(RLine, { label: React.createElement('span', { style: { color: 'var(--text-3)' } }, 'No revenue recorded'), value: CALC.fmt(0, currency), currency }),
    React.createElement(RLine, { label: 'Total Revenue', value: CALC.fmt(totInc, currency), cls: 'sub', currency }),
    React.createElement(RSec, { kind: 'exp' }, 'Operating Expenses'),
    exp.length ? exp.map((r, i) => React.createElement(RLine, { key: i, code: r.code, label: r.name, value: CALC.fmt(r.amount, currency), currency }))
      : React.createElement(RLine, { label: React.createElement('span', { style: { color: 'var(--text-3)' } }, 'No expenses recorded'), value: CALC.fmt(0, currency), currency }),
    React.createElement(RLine, { label: 'Total Expenses', value: CALC.fmt(totExp, currency), cls: 'sub', currency }),
    React.createElement(RLine, { label: net >= 0 ? 'Net Profit' : 'Net Loss', value: CALC.fmt(net, currency), cls: 'net', currency })
  );
}

/* ============ Income & Expense ============ */
function IEReport({ S, currency }) {
  const [period, setPeriod] = useState('all');
  const ent = periodEntries(S, period);
  const inc = groupByAccount(ent, S, 'income', currency);
  const exp = groupByAccount(ent, S, 'expense', currency);
  const totInc = inc.reduce((s, r) => s + r.amount, 0);
  const totExp = exp.reduce((s, r) => s + r.amount, 0);
  const net = totInc - totExp;
  return React.createElement(ReportShell, { title: 'Income & Expenditure', period, setPeriod },
    React.createElement('div', { className: 'rpt-cols' },
      React.createElement('div', null,
        React.createElement(RSec, { kind: 'inc' }, 'Income'),
        inc.length ? inc.map((r, i) => React.createElement(RLine, { key: i, label: r.name, value: CALC.fmt(r.amount, currency), currency }))
          : React.createElement(RLine, { label: React.createElement('span', { style: { color: 'var(--text-3)' } }, '\u2014'), value: CALC.fmt(0, currency), currency }),
        React.createElement(RLine, { label: 'Total Income', value: CALC.fmt(totInc, currency), cls: 'sub', currency })
      ),
      React.createElement('div', null,
        React.createElement(RSec, { kind: 'exp' }, 'Expenditure'),
        exp.length ? exp.map((r, i) => React.createElement(RLine, { key: i, label: r.name, value: CALC.fmt(r.amount, currency), currency }))
          : React.createElement(RLine, { label: React.createElement('span', { style: { color: 'var(--text-3)' } }, '\u2014'), value: CALC.fmt(0, currency), currency }),
        React.createElement(RLine, { label: 'Total Expenditure', value: CALC.fmt(totExp, currency), cls: 'sub', currency })
      )
    ),
    React.createElement('div', { className: 'rpt-balance ' + (net >= 0 ? 'ok' : 'no') },
      React.createElement('span', null, net >= 0 ? 'Surplus' : 'Deficit'),
      React.createElement('span', { className: 'num' }, React.createElement(FlipBoard, { text: CALC.fmt(net, currency), epoch: currency }))
    )
  );
}

/* ============ Balance Sheet ============ */
function BSReport({ S, currency }) {
  const [period, setPeriod] = useState('all');
  const ent = periodEntries(S, period);
  const assets = groupByAccount(ent, S, 'asset', currency);
  const liab = groupByAccount(ent, S, 'liability', currency);
  const equity = groupByAccount(ent, S, 'equity', currency);
  const totAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totLiab = liab.reduce((s, r) => s + r.amount, 0);
  const totInc = ent.filter(e => e.type === 'income').reduce((s, e) => s + CALC.conv(e, currency), 0);
  const totExp = ent.filter(e => e.type === 'expense').reduce((s, e) => s + CALC.conv(e, currency), 0);
  const retained = totInc - totExp;
  const totEquity = equity.reduce((s, r) => s + r.amount, 0) + retained;
  const balanced = Math.abs(totAssets - (totLiab + totEquity)) < 0.01;
  return React.createElement(ReportShell, { title: 'Balance Sheet', period, setPeriod },
    React.createElement('div', { className: 'rpt-cols' },
      React.createElement('div', null,
        React.createElement(RSec, { kind: 'ast' }, 'Assets'),
        assets.length ? assets.map((r, i) => React.createElement(RLine, { key: i, code: r.code, label: r.name, value: CALC.fmt(r.amount, currency), currency }))
          : React.createElement(RLine, { label: React.createElement('span', { style: { color: 'var(--text-3)' } }, 'No assets recorded'), value: CALC.fmt(0, currency), currency }),
        React.createElement(RLine, { label: 'Total Assets', value: CALC.fmt(totAssets, currency), cls: 'sub', currency })
      ),
      React.createElement('div', null,
        React.createElement(RSec, { kind: 'lia' }, 'Liabilities & Equity'),
        liab.map((r, i) => React.createElement(RLine, { key: 'l' + i, code: r.code, label: r.name, value: CALC.fmt(r.amount, currency), currency })),
        equity.map((r, i) => React.createElement(RLine, { key: 'e' + i, code: r.code, label: r.name, value: CALC.fmt(r.amount, currency), currency })),
        React.createElement(RLine, { label: 'Retained Earnings', value: CALC.fmt(retained, currency), currency }),
        React.createElement(RLine, { label: 'Total Liab. & Equity', value: CALC.fmt(totLiab + totEquity, currency), cls: 'sub', currency })
      )
    ),
    React.createElement('div', { className: 'rpt-balance ' + (balanced ? 'ok' : 'no') },
      React.createElement('span', null, balanced ? '\u2713 Balanced' : 'Out of balance by ' + CALC.fmt(totAssets - (totLiab + totEquity), currency)),
      React.createElement('span', { className: 'num' }, 'A ' + CALC.fmt(totAssets, currency) + '   \u00b7   L+E ' + CALC.fmt(totLiab + totEquity, currency))
    )
  );
}

/* ============ Trial Balance ============ */
function TBReport({ S, currency }) {
  const [period, setPeriod] = useState('all');
  const ent = periodEntries(S, period);
  // debit nature: asset, expense ; credit nature: income, liability, equity
  const map = {};
  ent.forEach(e => {
    const k = e.account || 'Unassigned';
    if (!map[k]) map[k] = { name: k, type: e.type, debit: 0, credit: 0, code: (S.accounts.find(a => a.name === k) || {}).code || '' };
    const v = CALC.conv(e, currency);
    if (e.type === 'asset' || e.type === 'expense') map[k].debit += v; else map[k].credit += v;
  });
  const rows = Object.values(map).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const totD = rows.reduce((s, r) => s + r.debit, 0);
  const totC = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totD - totC) < 0.01;
  return React.createElement(ReportShell, { title: 'Trial Balance', period, setPeriod },
    React.createElement('div', { className: 'tbl-scroll' },
      React.createElement('table', { className: 'tx' },
        React.createElement('thead', null, React.createElement('tr', null,
          React.createElement('th', { style: { width: 64 } }, 'Code'),
          React.createElement('th', null, 'Account'),
          React.createElement('th', null, 'Type'),
          React.createElement('th', { className: 'r' }, 'Debit'),
          React.createElement('th', { className: 'r' }, 'Credit')
        )),
        React.createElement('tbody', null,
          rows.length === 0
            ? React.createElement('tr', null, React.createElement('td', { colSpan: 5 }, React.createElement(Empty, { label: 'No postings for this period' })))
            : rows.map((r, i) => React.createElement('tr', { key: i },
                React.createElement('td', null, React.createElement('span', { className: 't-id' }, r.code)),
                React.createElement('td', null, React.createElement('span', { className: 't-desc' }, r.name)),
                React.createElement('td', null, React.createElement(TypeBadge, { type: r.type })),
                React.createElement('td', { className: 'r num' }, r.debit ? React.createElement(FlipBoard, { text: CALC.fmt(r.debit, currency), epoch: currency }) : '\u2014'),
                React.createElement('td', { className: 'r num' }, r.credit ? React.createElement(FlipBoard, { text: CALC.fmt(r.credit, currency), epoch: currency }) : '\u2014')
              ))
        ),
        rows.length > 0 && React.createElement('tfoot', null, React.createElement('tr', { style: { background: 'var(--bg-inset)', fontWeight: 700 } },
          React.createElement('td', { colSpan: 3, style: { fontFamily: 'var(--ui)', fontWeight: 700, color: balanced ? 'var(--pos)' : 'var(--neg)' } },
            balanced ? '\u2713 In balance' : 'Out of balance'),
          React.createElement('td', { className: 'r num', style: { fontWeight: 700 } }, React.createElement(FlipBoard, { text: CALC.fmt(totD, currency), epoch: currency })),
          React.createElement('td', { className: 'r num', style: { fontWeight: 700 } }, React.createElement(FlipBoard, { text: CALC.fmt(totC, currency), epoch: currency }))
        ))
      )
    )
  );
}

Object.assign(window, { PLReport, IEReport, BSReport, TBReport });
