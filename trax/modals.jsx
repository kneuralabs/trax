/* TRAX — modals: Entry, Account, GitHub connect */

function Modal({ title, sub, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return React.createElement('div', { className: 'ov', onMouseDown: e => { if (e.target === e.currentTarget) onClose(); } },
    React.createElement('div', { className: 'dialog', style: wide ? { maxWidth: '600px' } : null },
      React.createElement('div', { className: 'dialog-hd' },
        React.createElement('div', null,
          React.createElement('h2', null, title),
          sub && React.createElement('p', null, sub)
        ),
        React.createElement('button', { className: 'icobtn', onClick: onClose, style: { width: 28, height: 28 } }, React.createElement(Icon, { name: 'close', w: 14 }))
      ),
      children,
      footer && React.createElement('div', { className: 'dialog-ft' }, footer)
    )
  );
}

/* ---------------- Entry Modal ---------------- */
function EntryModal({ editing, onClose }) {
  const S = TRAX.Store;
  const today = new Date().toISOString().slice(0, 10);
  const blank = { date: today, type: 'expense', account: '', desc: '', amount: '', ref: '', usdInrRate: 84, paidBy: '', paidTo: '', notes: '' };
  const [f, setF] = useState(editing ? { ...editing, amount: String(editing.amount) } : blank);
  const txnId = editing ? editing.txnId : TRAX.genTxnId(S.nextId);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const accountsOfType = S.accounts.filter(a => a.type === f.type);
  useEffect(() => {
    if (!accountsOfType.find(a => a.name === f.account)) upd('account', accountsOfType[0] ? accountsOfType[0].name : '');
  }, [f.type]);

  function submit() {
    if (!f.desc.trim()) { toast('Description is required', 'err'); return; }
    const amt = parseFloat(f.amount);
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'err'); return; }
    const payload = {
      date: f.date, type: f.type, account: f.account, desc: f.desc.trim(),
      amount: amt, ref: f.ref.trim(), usdInrRate: parseFloat(f.usdInrRate) || 84,
      paidBy: f.paidBy.trim(), paidTo: f.paidTo.trim(), notes: f.notes.trim(),
    };
    if (editing) TRAX.updateEntry(editing.id, payload);
    else TRAX.addEntry(payload);
    window.__traxSave(editing ? 'Edit ' + txnId : 'Add ' + txnId);
    onClose();
  }

  const inrPreview = f.amount && f.usdInrRate ? '\u20B9' + (parseFloat(f.amount) * parseFloat(f.usdInrRate)).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '';

  return React.createElement(Modal, {
    title: editing ? 'Edit Entry' : 'New Journal Entry',
    sub: 'Income, expense, asset, liability or equity movement.',
    onClose, wide: true,
    footer: [
      React.createElement('button', { key: 'c', className: 'btn btn-ghost', onClick: onClose }, 'Cancel'),
      React.createElement('button', { key: 's', className: 'btn btn-accent', onClick: submit }, editing ? 'Update Entry' : 'Save Entry'),
    ],
  },
    React.createElement('div', { className: 'dialog-bd' },
      React.createElement('div', { className: 'fgrid' },
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'Transaction ID', React.createElement('span', { className: 'hint' }, 'AUTO')),
          React.createElement('input', { className: 'input readonly', value: txnId, readOnly: true })
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Date'),
          React.createElement('input', { className: 'input', type: 'date', value: f.date, onChange: e => upd('date', e.target.value) })
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Type'),
          React.createElement('select', { className: 'input', value: f.type, onChange: e => upd('type', e.target.value) },
            TRAX.TYPES.map(t => React.createElement('option', { key: t, value: t }, t[0].toUpperCase() + t.slice(1)))
          )
        ),
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'Account'),
          React.createElement('select', { className: 'input', value: f.account, onChange: e => upd('account', e.target.value) },
            accountsOfType.length === 0 && React.createElement('option', { value: '' }, '\u2014 no ' + f.type + ' accounts \u2014'),
            accountsOfType.map(a => React.createElement('option', { key: a.id, value: a.name }, a.code + ' \u00b7 ' + a.name))
          )
        ),
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'Description *'),
          React.createElement('input', { className: 'input', value: f.desc, placeholder: 'e.g. Monthly Renewal — Claude Pro', onChange: e => upd('desc', e.target.value) })
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Amount (USD) *'),
          React.createElement('div', { className: 'amt-wrap' },
            React.createElement('span', { className: 'cur' }, '$'),
            React.createElement('input', { className: 'input num', type: 'number', step: '0.01', min: '0', value: f.amount, placeholder: '0.00', onChange: e => upd('amount', e.target.value) })
          )
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Reference No.'),
          React.createElement('input', { className: 'input', value: f.ref, placeholder: 'Invoice / receipt ref', onChange: e => upd('ref', e.target.value) })
        ),
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'USD \u2192 INR Rate', inrPreview && React.createElement('span', { className: 'hint' }, '= ' + inrPreview)),
          React.createElement('div', { className: 'amt-wrap' },
            React.createElement('span', { className: 'cur' }, '\u20B9'),
            React.createElement('input', { className: 'input num', type: 'number', step: '0.01', value: f.usdInrRate, onChange: e => upd('usdInrRate', e.target.value) })
          )
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Paid By'),
          React.createElement('input', { className: 'input', list: 'dl-paidby', value: f.paidBy, placeholder: 'Name or entity', onChange: e => upd('paidBy', e.target.value) }),
          React.createElement('datalist', { id: 'dl-paidby' }, S.paidByList.map((n, i) => React.createElement('option', { key: i, value: n })))
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Paid To'),
          React.createElement('input', { className: 'input', list: 'dl-paidto', value: f.paidTo, placeholder: 'Name or entity', onChange: e => upd('paidTo', e.target.value) }),
          React.createElement('datalist', { id: 'dl-paidto' }, S.paidToList.map((n, i) => React.createElement('option', { key: i, value: n })))
        ),
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'Notes'),
          React.createElement('textarea', { className: 'input', value: f.notes, placeholder: 'Additional notes\u2026', onChange: e => upd('notes', e.target.value) })
        )
      )
    )
  );
}

/* ---------------- Account Modal ---------------- */
function AccountModal({ editing, onClose }) {
  const [f, setF] = useState(editing || { name: '', type: 'expense', code: TRAX.nextAccountCode('expense') });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  function onType(t) { setF(p => ({ ...p, type: t, code: editing ? p.code : TRAX.nextAccountCode(t) })); }
  function submit() {
    if (!f.name.trim()) { toast('Account name is required', 'err'); return; }
    if (editing) TRAX.updateAccount(editing.id, { name: f.name.trim(), type: f.type, code: f.code.trim() });
    else TRAX.addAccount({ name: f.name.trim(), type: f.type, code: f.code.trim() });
    window.__traxSave(editing ? 'Edit account ' + f.name : 'Add account ' + f.name);
    onClose();
  }
  return React.createElement(Modal, {
    title: editing ? 'Edit Account' : 'Add Account',
    sub: 'Define a line in the chart of accounts.',
    onClose,
    footer: [
      React.createElement('button', { key: 'c', className: 'btn btn-ghost', onClick: onClose }, 'Cancel'),
      React.createElement('button', { key: 's', className: 'btn btn-accent', onClick: submit }, editing ? 'Update' : 'Save Account'),
    ],
  },
    React.createElement('div', { className: 'dialog-bd' },
      React.createElement('div', { className: 'fgrid' },
        React.createElement('div', { className: 'fg full' },
          React.createElement('label', null, 'Account Name *'),
          React.createElement('input', { className: 'input', value: f.name, placeholder: 'e.g. SaaS Subscription', onChange: e => upd('name', e.target.value) })
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Type'),
          React.createElement('select', { className: 'input', value: f.type, onChange: e => onType(e.target.value) },
            TRAX.TYPES.map(t => React.createElement('option', { key: t, value: t }, t[0].toUpperCase() + t.slice(1)))
          )
        ),
        React.createElement('div', { className: 'fg' },
          React.createElement('label', null, 'Account Code'),
          React.createElement('input', { className: 'input num', value: f.code, onChange: e => upd('code', e.target.value) })
        )
      )
    )
  );
}

/* ---------------- GitHub Modal ---------------- */
function GithubModal({ onClose }) {
  const S = TRAX.Store;
  const connected = S.gh && S.gh.token;
  const [token, setToken] = useState('');
  const [url, setUrl] = useState((S.gh && `https://github.com/${S.gh.owner}/${S.gh.repo}/blob/${S.gh.branch}/${S.gh.path}`) || 'https://github.com/kneuralabs/trax/blob/main/FINANCE.xlsx');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    if (!token.trim()) { setStatus({ kind: 'err', msg: 'Enter a personal access token' }); return; }
    setBusy(true); setStatus({ kind: 'info', msg: 'Connecting & reading FINANCE.xlsx\u2026' });
    try {
      await TRAX.connectGithub(token.trim(), url.trim());
      setStatus({ kind: 'ok', msg: 'Connected \u00b7 ' + S.data.entries.length + ' entries loaded' });
      toast('Connected to GitHub', 'ok');
      setTimeout(onClose, 700);
    } catch (e) {
      setStatus({ kind: 'err', msg: String(e.message || e).slice(0, 120) });
    } finally { setBusy(false); }
  }
  function disconnect() { TRAX.disconnectGithub(); toast('Disconnected', ''); onClose(); }

  return React.createElement(Modal, {
    title: 'GitHub Data Source', sub: 'Read from and commit FINANCE.xlsx straight to the repo.', onClose,
    footer: connected ? [
      React.createElement('button', { key: 'd', className: 'btn btn-danger', onClick: disconnect }, 'Disconnect'),
      React.createElement('button', { key: 'c', className: 'btn btn-accent', onClick: onClose }, 'Done'),
    ] : [
      React.createElement('button', { key: 'c', className: 'btn btn-ghost', onClick: onClose }, 'Cancel'),
      React.createElement('button', { key: 's', className: 'btn btn-accent', onClick: connect, disabled: busy },
        busy && React.createElement(Icon, { name: 'refresh', w: 13 }), busy ? 'Working\u2026' : 'Connect & Load'),
    ],
  },
    React.createElement('div', { className: 'dialog-bd' },
      connected
        ? React.createElement('div', { className: 'gh-status ok' }, React.createElement(Icon, { name: 'check', w: 14 }),
            'Connected to ', React.createElement('strong', { className: 'mono' }, S.gh.owner + '/' + S.gh.repo), ' \u00b7 ', S.gh.path)
        : React.createElement('div', { className: 'gh-note' },
            'Create a fine-grained or classic token with ', React.createElement('code', null, 'repo'),
            ' (Contents: read & write) scope. It is stored only in this browser\u2019s local storage and used to read on load and commit on every change.'),
      React.createElement('div', { className: 'fg', style: { marginBottom: '13px' } },
        React.createElement('label', null, 'Personal Access Token'),
        React.createElement('input', { className: 'input mono', type: 'password', value: token, placeholder: connected ? '\u2022\u2022\u2022\u2022\u2022\u2022 (stored)' : 'ghp_\u2026', onChange: e => setToken(e.target.value), autoComplete: 'off' })
      ),
      React.createElement('div', { className: 'fg' },
        React.createElement('label', null, 'File URL'),
        React.createElement('input', { className: 'input mono', style: { fontSize: '11px' }, value: url, onChange: e => setUrl(e.target.value) })
      ),
      status && React.createElement('div', { className: 'gh-status ' + status.kind },
        busy && status.kind === 'info' ? React.createElement(Icon, { name: 'refresh', w: 13 }) : null, status.msg)
    )
  );
}

Object.assign(window, { Modal, EntryModal, AccountModal, GithubModal });
