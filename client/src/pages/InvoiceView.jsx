import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../api/axios';
import { money, dateLong, STATUS_OPTIONS } from '../lib/format';
import StatusBadge from '../components/StatusBadge';
import Logo from '../components/Logo';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/invoices/${id}`);
    setInvoice(res.data.invoice);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (newStatus) => {
    const res = await api.patch(`/invoices/${id}/status`, { status: newStatus });
    setInvoice(res.data.invoice);
  };

  const remove = async () => {
    if (!window.confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    navigate('/invoices');
  };

  const downloadPdf = async () => {
    if (!sheetRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Trot-TK-Invoice-${invoice.invoiceNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading…</div>;
  if (!invoice) return <div className="text-gray-400">Invoice not found.</div>;

  const c = invoice.client || {};
  const co = invoice.companyInfo || {};

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/invoices" className="text-sm text-primary-700 hover:underline">← Back to invoices</Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} />
          <select
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm capitalize"
            value={invoice.status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <button className="btn-ghost text-red-600" onClick={remove}>Delete</button>
          <button className="btn-primary" onClick={downloadPdf} disabled={downloading}>
            {downloading ? 'Preparing…' : '↓ Download PDF'}
          </button>
        </div>
      </div>

      {/* The printable invoice sheet — styled to match the sample */}
      <div ref={sheetRef} className="relative overflow-hidden rounded-lg bg-white px-12 py-12 shadow-sm" style={{ minHeight: 900 }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Logo size={64} />
            <div>
              <div className="text-xl font-bold">{co.name || 'Trot Tk'}</div>
              <div className="max-w-xs text-xs text-gray-500">{co.tagline}</div>
            </div>
          </div>
          <div className="text-lg font-bold tracking-wide">NO. {invoice.invoiceNumber}</div>
        </div>

        {/* Date */}
        <div className="mt-10 text-sm">
          <span className="font-bold">Date:</span>{' '}
          <span className="ml-2">{dateLong(invoice.issueDate)}</span>
        </div>

        {/* Billed to / From */}
        <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="font-bold">Billed to:</div>
            <div className="mt-1">{c.name}</div>
            {c.company && <div>{c.company}</div>}
            {c.email && <div>{c.email}</div>}
            {c.billingAddress && <div className="whitespace-pre-line text-gray-600">{c.billingAddress}</div>}
          </div>
          <div>
            <div className="font-bold">From:</div>
            <div className="mt-1">{co.name || 'Trot Tk'}</div>
            <div className="whitespace-pre-line text-gray-600">{co.address}</div>
          </div>
        </div>

        {/* Line items table */}
        <div className="mt-10">
          <div className="grid grid-cols-12 rounded bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
            <div className="col-span-6">Service</div>
            <div className="col-span-2 text-right">Total Hours</div>
            <div className="col-span-2 text-right">$/Hour</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {invoice.lineItems.map((li, i) => (
            <div key={i} className="grid grid-cols-12 border-b border-gray-100 px-4 py-4 text-sm">
              <div className="col-span-6 font-semibold">{li.service}</div>
              <div className="col-span-2 text-right">{li.totalHours}</div>
              <div className="col-span-2 text-right">{li.ratePerHour}</div>
              <div className="col-span-2 text-right">{money(li.amount, invoice.currency)}</div>
            </div>
          ))}

          {/* Total */}
          <div className="mt-6 grid grid-cols-12 border-t border-gray-200 px-4 py-4 text-sm">
            <div className="col-span-8"></div>
            <div className="col-span-2 text-right font-bold text-gray-700">Total</div>
            <div className="col-span-2 text-right font-bold">{money(invoice.total, invoice.currency)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 space-y-1 text-sm text-gray-600">
          <div>Payment Terms: Net {invoice.paymentTermsDays} days.</div>
          <div>Thank you for your business!</div>
          <div>Contact us at {co.email || 'support@trottk.com'} for any questions.</div>
          <div className="mt-4 font-semibold text-gray-700">Trot Tk - Moving Fast, Building Smart</div>
        </div>

        {/* Decorative wave accent in brand color */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 opacity-10"
          style={{ background: 'radial-gradient(120% 100% at 80% 100%, #FF8361 0%, transparent 70%)' }}
        />
      </div>
    </div>
  );
}
