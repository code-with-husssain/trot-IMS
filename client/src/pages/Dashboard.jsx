import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import api from '../api/axios';
import { money } from '../lib/format';
import StatusBadge from '../components/StatusBadge';

function KpiCard({ label, value, accent }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent || ''}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [recent, setRecent] = useState([]);
  const [clientId, setClientId] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data.clients));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (clientId) params.clientId = clientId;
    if (year) params.year = year;
    Promise.all([
      api.get('/dashboard', { params }),
      api.get('/invoices', { params }),
    ]).then(([d, inv]) => {
      setData(d.data);
      setRecent(inv.data.invoices.slice(0, 6));
      setLoading(false);
    });
  }, [clientId, year]);

  const years = data?.years || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Revenue & invoice metrics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-[200px]" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select className="input max-w-[140px]" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading || !data ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Revenue" value={money(data.summary.totalRevenue)} accent="text-primary-700" />
            <KpiCard label="Received / Paid" value={money(data.summary.paid)} accent="text-green-600" />
            <KpiCard label="Outstanding" value={money(data.summary.outstanding)} accent="text-amber-600" />
            <KpiCard label="Invoices" value={data.summary.invoiceCount} />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Monthly Revenue</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#FF836110' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {data.monthlyRevenue.map((_, i) => (
                        <Cell key={i} fill="#FF8361" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

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
          </div>

          <div className="mt-6 card p-0">
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
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No invoices yet.</td></tr>
                ) : (
                  recent.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-semibold">
                        <Link to={`/invoices/${inv._id}`} className="text-primary-700 hover:underline">
                          NO. {inv.invoiceNumber}
                        </Link>
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
        </>
      )}
    </div>
  );
}
