import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { money, dateShort, STATUS_OPTIONS } from '../lib/format';
import StatusBadge from '../components/StatusBadge';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (clientId) params.clientId = clientId;
    if (status) params.status = status;
    const res = await api.get('/invoices', { params });
    setInvoices(res.data.invoices);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data.clients));
  }, []);

  useEffect(() => {
    load();
  }, [clientId, status]);

  const changeStatus = async (id, newStatus) => {
    const res = await api.patch(`/invoices/${id}/status`, { status: newStatus });
    setInvoices((prev) => prev.map((i) => (i._id === id ? { ...i, status: res.data.invoice.status } : i)));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-gray-400">Generate and track invoices</p>
        </div>
        <Link className="btn-primary" to="/invoices/new">+ New Invoice</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input max-w-xs" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">No.</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No invoices found.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold">
                    <Link to={`/invoices/${inv._id}`} className="text-primary-700 hover:underline">
                      NO. {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{inv.client?.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{dateShort(inv.issueDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={inv.status} />
                      <select
                        className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs capitalize"
                        value={inv.status}
                        onChange={(e) => changeStatus(inv._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{money(inv.total, inv.currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
