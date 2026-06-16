import { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../lib/format';

const today = () => new Date().toISOString().slice(0, 10);

const base = {
  description: '',
  amount: '',
  category: 'Misc',
  vendor: '',
  currency: 'USD',
  notes: '',
  recurring: false,
  date: today(),
  startDate: today(),
  endDate: '',
};

export default function ExpenseForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Save' }) {
  const init = { ...base, ...initial };
  if (init.date) init.date = String(init.date).slice(0, 10);
  if (init.startDate) init.startDate = String(init.startDate).slice(0, 10);
  if (init.endDate) init.endDate = String(init.endDate).slice(0, 10);

  const [form, setForm] = useState(init);
  const [customCat, setCustomCat] = useState(!EXPENSE_CATEGORIES.includes(init.category));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        description: form.description,
        amount: Number(form.amount),
        category: form.category || 'Misc',
        vendor: form.vendor,
        currency: form.currency,
        notes: form.notes,
        recurring: form.recurring,
      };
      if (form.recurring) {
        payload.startDate = form.startDate;
        payload.endDate = form.endDate || undefined;
      } else {
        payload.date = form.date;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Description *</label>
          <input className="input" value={form.description} onChange={set('description')} required placeholder="e.g. AWS hosting, March salaries" />
        </div>
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="any" min="0" className="input" value={form.amount} onChange={set('amount')} required />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={form.currency} onChange={set('currency')}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="PKR">PKR</option>
          </select>
        </div>

        <div>
          <label className="label">Category</label>
          {customCat ? (
            <input className="input" value={form.category} onChange={set('category')} placeholder="Custom category" />
          ) : (
            <select className="input" value={form.category} onChange={set('category')}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button type="button" className="mt-1 text-xs text-primary-700 hover:underline" onClick={() => setCustomCat(!customCat)}>
            {customCat ? 'Pick from list' : '+ Custom category'}
          </button>
        </div>
        <div>
          <label className="label">Vendor / Payee</label>
          <input className="input" value={form.vendor} onChange={set('vendor')} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
        Recurring monthly expense
      </label>

      {form.recurring ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start month *</label>
            <input type="date" className="input" value={form.startDate} onChange={set('startDate')} required />
          </div>
          <div>
            <label className="label">End month (optional)</label>
            <input type="date" className="input" value={form.endDate} onChange={set('endDate')} />
          </div>
          <p className="col-span-2 text-xs text-gray-400">
            Counted once every month from start to end (leave end blank for ongoing).
          </p>
        </div>
      ) : (
        <div>
          <label className="label">Date</label>
          <input type="date" className="input max-w-[200px]" value={form.date} onChange={set('date')} />
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
