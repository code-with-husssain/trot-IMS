import { useEffect, useState } from 'react';
import api from '../api/axios';
import { money, dateShort, MONTHS } from '../lib/format';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';

const now = new Date();

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = { year, month };
    if (category) params.category = category;
    const res = await api.get('/expenses', { params });
    setExpenses(res.data.expenses);
    setRecurring(res.data.recurring);
    setTotal(res.data.total);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/expenses/categories').then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    load();
  }, [month, year, category]);

  const create = async (payload) => {
    await api.post('/expenses', payload);
    setAdding(false);
    load();
  };
  const update = async (payload) => {
    await api.put(`/expenses/${editing._id}`, payload);
    setEditing(null);
    load();
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  const years = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 4; y--) years.push(y);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-gray-400">Track money out, month by month</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add Expense</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input max-w-[160px]" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="input max-w-[120px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2">
          <span className="text-xs font-semibold uppercase text-primary-700">{MONTHS[month - 1]} total</span>
          <span className="text-lg font-bold text-primary-700">{money(total)}</span>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No expenses this month.</td></tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id + (e.isRecurring ? '-r' : '')} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">{dateShort(e.effectiveDate)}</td>
                  <td className="px-5 py-3 font-semibold">
                    {e.description}
                    {e.isRecurring && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">recurring</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{e.category}</td>
                  <td className="px-5 py-3 text-gray-600">{e.vendor || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold">{money(e.amount, e.currency)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs text-gray-400 hover:text-primary-700" onClick={() => setEditing(e)}>Edit</button>
                    <button className="ml-3 text-xs text-gray-400 hover:text-red-500" onClick={() => remove(e._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {recurring.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Recurring expenses</h3>
          <div className="card p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">From</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3 text-right">Amount / mo</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recurring.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold">{r.description}</td>
                    <td className="px-5 py-3 text-gray-600">{r.category}</td>
                    <td className="px-5 py-3 text-gray-600">{dateShort(r.startDate)}</td>
                    <td className="px-5 py-3 text-gray-600">{r.endDate ? dateShort(r.endDate) : 'Ongoing'}</td>
                    <td className="px-5 py-3 text-right font-semibold">{money(r.amount, r.currency)}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs text-gray-400 hover:text-primary-700" onClick={() => setEditing(r)}>Edit</button>
                      <button className="ml-3 text-xs text-gray-400 hover:text-red-500" onClick={() => remove(r._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Expense">
        <ExpenseForm onSubmit={create} onCancel={() => setAdding(false)} submitLabel="Add Expense" />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Expense">
        {editing && <ExpenseForm initial={editing} onSubmit={update} onCancel={() => setEditing(null)} submitLabel="Save Changes" />}
      </Modal>
    </div>
  );
}
