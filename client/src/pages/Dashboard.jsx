import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from 'recharts';
import api from '../api/axios';
import { money } from '../lib/format';
import StatusBadge from '../components/StatusBadge';

function KpiCard({ label, value, accent, hint }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent || ''}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

const now = new Date();

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [recent, setRecent] = useState([]);
  const [clientId, setClientId] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data.clients));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { year };
    if (clientId) params.clientId = clientId;
    Promise.all([
      api.get('/dashboard', { params }),
      api.get('/invoices', { params: { ...(clientId ? { clientId } : {}), year } }),
    ]).then(([d, inv]) => {
      setData(d.data);
      setRecent(inv.data.invoices.slice(0, 6));
      setLoading(false);
    });
  }, [clientId, year]);

  const years = data?.years?.length ? data.years : [now.getFullYear()];
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Money in vs money out — {year}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-[200px]" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input max-w-[140px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading || !data ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Invoiced" value={money(data.summary.invoiced)} hint={`${data.summary.invoiceCount} invoices`} />
            <KpiCard label="Received (in)" value={money(data.summary.received)} accent="text-green-600" />
            <KpiCard label="Outstanding" value={money(data.summary.outstanding)} accent="text-amber-600" hint="receivables" />
            <KpiCard label="Expenses (out)" value={money(data.summary.expenses)} accent="text-red-600" />
            <KpiCard
              label="Net"
              value={money(data.summary.net)}
              accent={data.summary.net >= 0 ? 'text-primary-700' : 'text-red-600'}
              hint="received − expenses"
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Income vs Expenses — {year}</h3>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#FF836108' }} />
                    <Legend />
                    <Bar dataKey="received" name="Received" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="#FF8361" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Expenses by Category</h3>
              <div className="space-y-3">
                {data.expenseByCategory.length === 0 ? (
                  <p className="text-sm text-gray-400">No expenses this year.</p>
                ) : (
                  data.expenseByCategory.map((c) => {
                    const pct = data.summary.expenses ? (c.total / data.summary.expenses) * 100 : 0;
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{c.category}</span>
                          <span className="text-gray-600">{money(c.total)}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="card">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Top Clients</h3>
              <div className="space-y-3">
                {data.topClients.length === 0 ? (
                  <p className="text-sm text-gray-400">No data yet.</p>
                ) : (
                  data.topClients.map((tc) => (
                    <div key={tc.clientId} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold">{tc.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{tc.invoiceCount} invoice(s)</div>
                      </div>
                      <div className="font-bold">{money(tc.totalBilled)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-0 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Recent Invoices</h3>
                <Link to="/invoices" className="text-sm text-primary-700 hover:underline">View all →</Link>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">No.</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No invoices this year.</td></tr>
                  ) : (
                    recent.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-semibold">
                          <Link to={`/invoices/${inv._id}`} className="text-primary-700 hover:underline">NO. {inv.invoiceNumber}</Link>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{inv.client?.name || '—'}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3 text-right font-semibold">{money(inv.total, inv.currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
