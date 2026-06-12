const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

exports.list = async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }];
  }
  const clients = await Client.find(filter).sort({ createdAt: -1 });

  // Attach invoice count + total billed per client for the listing view.
  const stats = await Invoice.aggregate([
    { $group: { _id: '$client', invoiceCount: { $sum: 1 }, totalBilled: { $sum: '$total' } } },
  ]);
  const statMap = new Map(stats.map((s) => [String(s._id), s]));

  const enriched = clients.map((c) => {
    const s = statMap.get(String(c._id));
    return {
      ...c.toObject(),
      invoiceCount: s ? s.invoiceCount : 0,
      totalBilled: s ? s.totalBilled : 0,
    };
  });
  res.json({ clients: enriched });
};

exports.get = async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const invoices = await Invoice.find({ client: client._id }).sort({ createdAt: -1 });
  res.json({ client, invoices });
};

exports.create = async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Client name is required' });
  const client = await Client.create(req.body);
  res.status(201).json({ client });
};

exports.update = async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json({ client });
};

exports.remove = async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  // Clean up the client's invoices to avoid orphans.
  await Invoice.deleteMany({ client: client._id });
  res.json({ message: 'Client and associated invoices deleted' });
};
