import { useState } from 'react';

const empty = { name: '', email: '', company: '', billingAddress: '', phone: '', notes: '' };

export default function ClientForm({ initial = empty, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label">Company</label>
          <input className="input" value={form.company} onChange={set('company')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={set('phone')} />
        </div>
      </div>
      <div>
        <label className="label">Billing Address</label>
        <textarea className="input" rows={2} value={form.billingAddress} onChange={set('billingAddress')} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
