import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { money } from '../lib/format';

const blankItem = () => ({ service: '', totalHours: '', ratePerHour: '' });

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(searchParams.get('client') || '');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentTermsDays, setPaymentTermsDays] = useState(15);
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState([blankItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data.clients));
  }, []);

  const setItem = (idx, key) => (e) => {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: e.target.value };
    setItems(next);
  };
  const addItem = () => setItems([...items, blankItem()]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const lineAmount = (it) => (Number(it.totalHours) || 0) * (Number(it.ratePerHour) || 0);
  const total = items.reduce((s, it) => s + lineAmount(it), 0);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!clientId) return setError('Please select a client');
    const cleaned = items
      .filter((it) => it.service && it.totalHours && it.ratePerHour)
      .map((it) => ({
        service: it.service,
        totalHours: Number(it.totalHours),
        ratePerHour: Number(it.ratePerHour),
      }));
    if (cleaned.length === 0) return setError('Add at least one complete line item');

    setSaving(true);
    try {
      const res = await api.post('/invoices', {
        client: clientId,
        issueDate,
        paymentTermsDays: Number(paymentTermsDays),
        currency,
        lineItems: cleaned,
      });
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/invoices" className="text-sm text-primary-700 hover:underline">← Back to invoices</Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold">New Invoice</h1>

      <form onSubmit={submit} className="card space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="col-span-2">
            <label className="label">Client *</label>
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Issue Date</label>
            <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Terms (days)</label>
            <input type="number" min="0" className="input" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Line Items</label>
            <select className="rounded border border-gray-200 px-2 py-1 text-xs" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="PKR">PKR</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase text-gray-400 md:grid">
              <div className="col-span-5">Service</div>
              <div className="col-span-2 text-right">Total Hours</div>
              <div className="col-span-2 text-right">$/Hour</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-2">
                <input className="input col-span-12 md:col-span-5" placeholder="Talent as a Service (1-16 Jan)" value={it.service} onChange={setItem(idx, 'service')} />
                <input type="number" step="any" min="0" className="input col-span-4 text-right md:col-span-2" placeholder="Hours" value={it.totalHours} onChange={setItem(idx, 'totalHours')} />
                <input type="number" step="any" min="0" className="input col-span-4 text-right md:col-span-2" placeholder="Rate" value={it.ratePerHour} onChange={setItem(idx, 'ratePerHour')} />
                <div className="col-span-3 text-right text-sm font-semibold md:col-span-2">{money(lineAmount(it), currency)}</div>
                <button type="button" className="col-span-1 text-gray-400 hover:text-red-500" onClick={() => removeItem(idx)} disabled={items.length === 1}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-3" onClick={addItem}>+ Add line item</button>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-400">Payment Terms: Net {paymentTermsDays} days</div>
          <div className="text-right">
            <div className="text-xs uppercase text-gray-400">Total</div>
            <div className="text-2xl font-bold text-primary-700">{money(total, currency)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={() => navigate('/invoices')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Generating…' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
