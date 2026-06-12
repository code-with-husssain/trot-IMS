import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { money } from '../lib/format';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async (q = '') => {
    setLoading(true);
    const res = await api.get('/clients', { params: q ? { search: q } : {} });
    setClients(res.data.clients);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const addClient = async (form) => {
    await api.post('/clients', form);
    setShowAdd(false);
    load(search);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-gray-400">Onboard and manage your clients</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add Client
        </button>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-right">Invoices</th>
              <th className="px-5 py-3 text-right">Total Billed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">Loading…</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No clients yet. Add your first client.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold">
                    <Link to={`/clients/${c._id}`} className="text-primary-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.company || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-right">{c.invoiceCount}</td>
                  <td className="px-5 py-3 text-right font-semibold">{money(c.totalBilled)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Onboard New Client">
        <ClientForm onSubmit={addClient} onCancel={() => setShowAdd(false)} submitLabel="Add Client" />
      </Modal>
    </div>
  );
}
