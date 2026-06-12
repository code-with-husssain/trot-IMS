const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Counter = require('../models/Counter');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Recompute amounts/subtotal/total server-side — never trust client totals.
function computeTotals(lineItems = []) {
  const items = lineItems.map((li) => {
    const totalHours = Number(li.totalHours) || 0;
    const ratePerHour = Number(li.ratePerHour) || 0;
    return {
      service: li.service,
      totalHours,
      ratePerHour,
      amount: round2(totalHours * ratePerHour),
    };
  });
  const subtotal = round2(items.reduce((sum, li) => sum + li.amount, 0));
  return { items, subtotal, total: subtotal };
}

exports.list = async (req, res) => {
  const { clientId, status, year } = req.query;
  const filter = {};
  if (clientId) filter.client = clientId;
  if (status) filter.status = status;
  if (year) {
    const y = Number(year);
    filter.issueDate = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
  }
  const invoices = await Invoice.find(filter)
    .populate('client', 'name email company')
    .sort({ createdAt: -1 });
  res.json({ invoices });
};

exports.get = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ invoice });
};

exports.create = async (req, res) => {
  const { client, lineItems, issueDate, paymentTermsDays, currency } = req.body || {};
  if (!client) return res.status(400).json({ message: 'Client is required' });
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ message: 'At least one line item is required' });
  }

  const clientDoc = await Client.findById(client);
  if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

  const seq = await Counter.next('invoice');
  const invoiceNumber = String(seq).padStart(5, '0');

  const { items, subtotal, total } = computeTotals(lineItems);

  const issue = issueDate ? new Date(issueDate) : new Date();
  const terms = paymentTermsDays != null ? Number(paymentTermsDays) : 15;
  const dueDate = new Date(issue.getTime() + terms * 24 * 60 * 60 * 1000);

  const invoice = await Invoice.create({
    invoiceNumber,
    client,
    issueDate: issue,
    dueDate,
    paymentTermsDays: terms,
    lineItems: items,
    subtotal,
    total,
    currency: currency || 'USD',
    status: 'pending',
    statusHistory: [{ status: 'pending', changedAt: new Date() }],
  });

  const populated = await invoice.populate('client');
  res.status(201).json({ invoice: populated });
};

exports.update = async (req, res) => {
  const { lineItems, issueDate, paymentTermsDays, currency } = req.body || {};
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const { items, subtotal, total } = computeTotals(lineItems);
    invoice.lineItems = items;
    invoice.subtotal = subtotal;
    invoice.total = total;
  }
  if (issueDate) invoice.issueDate = new Date(issueDate);
  if (paymentTermsDays != null) invoice.paymentTermsDays = Number(paymentTermsDays);
  if (currency) invoice.currency = currency;
  if (issueDate || paymentTermsDays != null) {
    invoice.dueDate = new Date(
      invoice.issueDate.getTime() + invoice.paymentTermsDays * 24 * 60 * 60 * 1000
    );
  }

  await invoice.save();
  const populated = await invoice.populate('client');
  res.json({ invoice: populated });
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body || {};
  if (!Invoice.STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${Invoice.STATUSES.join(', ')}` });
  }
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  invoice.status = status;
  invoice.statusHistory.push({ status, changedAt: new Date() });
  await invoice.save();
  const populated = await invoice.populate('client');
  res.json({ invoice: populated });
};

exports.remove = async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
};
