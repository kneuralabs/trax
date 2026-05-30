/* TRAX — screens: Dashboard, Ledger, Accounts */

function fmtDate(d) {
  if (!d) return '\u2014';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
}

function delEntry(e, after) {
  if (window.confirm('Delete ' + e.txnId + ' — "' + e.desc + '"?')) {
    TRAX.deleteEntry(e.id); window.__traxSave('Delete ' + e.txnId); toast('Entry deleted', ''); after && after();
  }
}

/* ============ DASHBOARD ============ */
function Dashboard({ S, currency, go, openEntry }) {
  const t = CALC.totalsByType(S.entries, currency);
  const series = CALC.monthlySeries(S.entries, currency, 6);
  const expCats = CALC.byAccount(S.entries, 'expense', currency);
  const recent = [...S.entries].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id).slice(0, 8);

  const cells = [
    { label: 'Income', val: CALC.fmt(t.income, currency), color: 'var(--pos)', sub: S.entries.filter(e => e.type === 'income').length + ' entries' },
    { label: 'Expense', val: CALC.fmt(t.expense, currency), color: 'var(--neg)', sub: S.entries.filter(e => e.type === 'expense').length + ' entries' },
    { label: 'Net Result', val: CALC.fmt(t.net, currency), color: t.net >= 0 ? 'var(--pos)' : 'var(--neg)', cls: t.net >= 0 ? 'up' : 'down', sub: t.net >= 0 ? 'Surplus' : 'Deficit' },
    { label: 'Assets', val: CALC.fmt(t.asset, currency), color: 'var(--info)', sub: 'on book' },
    { label: 'Entries', val: String(S.entries.length), color: 'var(--accent)', sub: S.accounts.length + ' accounts', plain: true },
  ];

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { className: 'ticker' },
      cells.map((c, i) => React.createElement('div', { className: 'tk', key: i },
        React.createElement('div', { className: 'tk-label' },
          React.createElement('span', { className: 'swatch', style: { background: c.color } }), c.label),
        React.createElement('div', { className: 'tk-val', style: { color: c.plain ? 'var(--text)' : c.color } }, c.val),
        React.createElement('div', { className: 'tk-sub' },
          c.cls && React.createElement('span', { className: 'tk-delta ' + c.cls }, c.cls === 'up' ? '\u25B2' : '\u25BC'),
          c.sub)
      ))
    ),
    React.createElement('div', { className: 'grid-2' },
      React.createElement('div', { className: 'panel' },
        React.createElement('div', { className: 'panel-hd' },
          React.createElement('h3', null, 'Cash Flow', React.createElement('span', { className: 'tag' }, 'last 6 mo')),
          React.createElement('span', { className: 'sec-label' }, currency)
        ),
        React.createElement('div', { className: 'panel-bd' }, React.createElement(BarChart, { series, currency }))
      ),
      React.createElement('div', { className: 'panel' },
        React.createElement('div', { className: 'panel-hd' },
          React.createElement('h3', null, 'Spend by Account'),
          React.createElement('span', { className: 'tag' }, expCats.length + ' cats')
        ),
        React.createElement('div', { className: 'panel-bd' }, React.createElement(CatBars, { rows: expCats, currency, color: 'var(--neg)' }))
      )
    ),
    React.createElement('div', { className: 'panel', style: { marginTop: '16px' } },
      React.createElement('div', { className: 'panel-hd' },
        React.createElement('h3', null, 'Recent Transactions'),
        React.createElement('button', { className: 'btn btn-sm btn-ghost', onClick: () => go('ledger') }, 'View ledger \u2192')
      ),
      recent.length === 0
        ? React.createElement(Empty, { label: 'No transactions yet', sub: 'Press N or + to add your first entry' })
        : React.createElement('div', { className: 'tbl-scroll' }, React.createElement(LedgerTable, { rows: recent, currency, openEntry, compact: true }))
    )
  );
}

/* ============ LEDGER TABLE (shared) ============ */
function LedgerTable({ rows, currency, openEntry, compact }) {
  return React.createElement('table', { className: 'tx' },
    React.createElement('thead', null, React.createElement('tr', null,
      React.createElement('th', null, 'Txn'),
      React.createElement('th', null, 'Date'),
      React.createElement('th', null, 'Type'),
      !compact && React.createElement('th', null, 'Account'),
      React.createElement('th', null, 'Description'),
      React.createElement('th', { className: 'r' }, 'Amount'),
      React.createElement('th', { style: { width: 54 } }, '')
    )),
    React.createElement('tbody', null, rows.map(e => React.createElement('tr', { key: e.id },
      React.createElement('td', null, React.createElement('span', { className: 't-id' }, React.createElement(RollDigits, { text: e.txnId.replace('TXN-', '#') }))),
      React.createElement('td', { className: 'num', style: { color: 'var(--text-2)' } }, fmtDate(e.date)),
      React.createElement('td', null, React.createElement(TypeBadge, { type: e.type })),
      !compact && React.createElement('td', null, e.account || '\u2014'),
      React.createElement('td', null,
        React.createElement('div', { className: 't-desc' }, e.desc),
        (e.paidTo || e.ref) && React.createElement('div', { className: 't-meta' },
          [e.paidTo && ('\u2192 ' + e.paidTo), e.ref && ('ref ' + e.ref)].filter(Boolean).join('  \u00b7  '))
      ),
      React.createElement('td', { className: 'r' },
        React.createElement('span', { className: 't-amt ' + (e.type === 'income' ? 'pos' : e.type === 'expense' ? 'neg' : '') },
          (e.type === 'expense' ? '\u2212' : e.type === 'income' ? '+' : '') + CALC.fmtRaw(e, currency).replace('\u2212', ''))
      ),
      React.createElement('td', null, React.createElement('div', { className: 'rowact' },
        React.createElement('button', { className: 'iconmini', title: 'Edit', onClick: () => openEntry(e) }, React.createElement(Icon, { name: 'edit', w: 13 })),
        React.createElement('button', { className: 'iconmini del', title: 'Delete', onClick: () => delEntry(e) }, React.createElement(Icon, { name: 'trash', w: 13 }))
      ))
    )))
  );
}

/* ============ LEDGER PAGE ============ */
function Ledger({ S, currency, openEntry }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return [...S.entries]
      .filter(e => !type || e.type === type)
      .filter(e => !ql || [e.desc, e.account, e.ref, e.paidBy, e.paidTo, e.txnId, e.notes].some(v => (v || '').toLowerCase().includes(ql)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
  }, [S.entries, q, type]);

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { className: 'filters' },
      React.createElement('div', { className: 'field search' },
        React.createElement(Icon, { name: 'search', w: 14 }),
        React.createElement('input', { className: 'input with-ic', placeholder: 'Search description, account, party, ref\u2026', value: q, onChange: e => setQ(e.target.value) })
      ),
      React.createElement('select', { className: 'input', style: { minWidth: 140 }, value: type, onChange: e => setType(e.target.value) },
        React.createElement('option', { value: '' }, 'All Types'),
        TRAX.TYPES.map(t => React.createElement('option', { key: t, value: t }, t[0].toUpperCase() + t.slice(1)))
      ),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('span', { className: 'sec-label', style: { alignSelf: 'center' } }, rows.length + ' of ' + S.entries.length)
    ),
    React.createElement('div', { className: 'panel' },
      rows.length === 0
        ? React.createElement(Empty, { label: 'No matching entries', sub: q || type ? 'Clear filters to see all' : 'Add your first transaction' })
        : React.createElement('div', { className: 'tbl-scroll' }, React.createElement(LedgerTable, { rows, currency, openEntry }))
    )
  );
}

/* ============ ACCOUNTS ============ */
function Accounts({ S, currency, openAccount }) {
  const [type, setType] = useState('');
  const usage = useMemo(() => {
    const m = {};
    S.entries.forEach(e => { m[e.account] = m[e.account] || { n: 0, sum: 0 }; m[e.account].n++; m[e.account].sum += CALC.conv(e, currency); });
    return m;
  }, [S.entries, currency]);
  const accts = S.accounts.filter(a => !type || a.type === type).slice().sort((a, b) => a.code.localeCompare(b.code));

  function delAcc(a) {
    const used = usage[a.name] && usage[a.name].n;
    if (used) { toast('Cannot delete — ' + used + ' entries use this account', 'err'); return; }
    if (window.confirm('Delete account "' + a.name + '"?')) { TRAX.deleteAccount(a.id); window.__traxSave('Delete account ' + a.name); toast('Account deleted', ''); }
  }

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { className: 'filters' },
      React.createElement('select', { className: 'input', style: { minWidth: 150 }, value: type, onChange: e => setType(e.target.value) },
        React.createElement('option', { value: '' }, 'All Account Types'),
        TRAX.TYPES.map(t => React.createElement('option', { key: t, value: t }, t[0].toUpperCase() + t.slice(1)))
      ),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', { className: 'btn btn-accent btn-sm', onClick: () => openAccount(null) },
        React.createElement(Icon, { name: 'plus', w: 14 }), 'Add Account')
    ),
    React.createElement('div', { className: 'panel' },
      React.createElement('div', { className: 'tbl-scroll' },
        React.createElement('table', { className: 'tx' },
          React.createElement('thead', null, React.createElement('tr', null,
            React.createElement('th', { style: { width: 72 } }, 'Code'),
            React.createElement('th', null, 'Account'),
            React.createElement('th', null, 'Type'),
            React.createElement('th', { className: 'r' }, 'Entries'),
            React.createElement('th', { className: 'r' }, 'Total'),
            React.createElement('th', { style: { width: 54 } }, '')
          )),
          React.createElement('tbody', null, accts.map(a => {
            const u = usage[a.name] || { n: 0, sum: 0 };
            return React.createElement('tr', { key: a.id },
              React.createElement('td', null, React.createElement('span', { className: 't-id' }, a.code)),
              React.createElement('td', null, React.createElement('span', { className: 't-desc' }, a.name)),
              React.createElement('td', null, React.createElement(TypeBadge, { type: a.type })),
              React.createElement('td', { className: 'r num', style: { color: 'var(--text-2)' } }, u.n || '\u2014'),
              React.createElement('td', { className: 'r num', style: { fontWeight: 600 } }, u.sum ? CALC.fmt(u.sum, currency) : '\u2014'),
              React.createElement('td', null, React.createElement('div', { className: 'rowact' },
                React.createElement('button', { className: 'iconmini', title: 'Edit', onClick: () => openAccount(a) }, React.createElement(Icon, { name: 'edit', w: 13 })),
                React.createElement('button', { className: 'iconmini del', title: 'Delete', onClick: () => delAcc(a) }, React.createElement(Icon, { name: 'trash', w: 13 }))
              ))
            );
          }))
        )
      )
    )
  );
}

Object.assign(window, { Dashboard, Ledger, Accounts, LedgerTable, fmtDate });
