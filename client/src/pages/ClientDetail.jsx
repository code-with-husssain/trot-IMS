import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { money, dateShort } from '../lib/format';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/clients/${id}`);
    setClient(res.data.client);
    setInvoices(res.data.invoices);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async (form) => {
    await api.put(`/clients/${id}`, form);
    setEditing(false);
    load();
  };

  const remove = async () => {
    if (!window.confirm('Delete this client and all their invoices?')) return;
    await api.delete(`/clients/${id}`);
    navigate('/clients');
  };

  if (loading) return <div className="text-gray-400">Loading…</div>;
  if (!client) return <div className="text-gray-400">Client not found.</div>;

  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <Link to="/clients" className="text-sm text-primary-700 hover:underline">← Back to clients</Link>

      <div className="mt-3 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-gray-400">{client.company || 'Individual client'}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn-ghost text-red-600" onClick={remove}>Delete</button>
          <Link className="btn-primary" to={`/invoices/new?client=${client._id}`}>+ New Invoice</Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="card md:col-span-1">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Details</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-400">Email</dt><dd>{client.email || '—'}</dd></div>
            <div><dt className="text-gray-400">Phone</dt><dd>{client.phone || '—'}</dd></div>
            <div><dt className="text-gray-400">Billing Address</dt><dd className="whitespace-pre-line">{client.billingAddress || '—'}</dd></div>
            <div><dt className="text-gray-400">Notes</dt><dd>{client.notes || '—'}</dd></div>
            <div><dt className="text-gray-400">Total Billed</dt><dd className="font-bold">{money(totalBilled)}</dd></div>
          </dl>
        </div>

        <div className="card md:col-span-2 p-0">
          <h3 className="border-b border-gray-50 px-5 py-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Invoices ({invoices.length})
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">No.</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No invoices yet.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold">
                      <Link to={`/invoices/${inv._id}`} className="text-primary-700 hover:underline">
                        NO. {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{dateShort(inv.issueDate)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-right font-semibold">{money(inv.total, inv.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Client">
        <ClientForm initial={client} onSubmit={save} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
      </Modal>
    </div>
  );
}
