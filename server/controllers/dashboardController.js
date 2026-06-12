const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

const PAID_STATUSES = ['paid', 'received'];

exports.metrics = async (req, res) => {
  const { clientId, year } = req.query;
  const match = {};
  if (clientId) match.client = new mongoose.Types.ObjectId(clientId);
  if (year) {
    const y = Number(year);
    match.issueDate = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
  }

  const [totals] = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
        paid: {
          $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, '$total', 0] },
        },
        outstanding: {
          $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, 0, '$total'] },
        },
      },
    },
  ]);

  // Revenue per month (1-12) for the chart.
  const monthlyRaw = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $month: '$issueDate' },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
  ]);
  const monthMap = new Map(monthlyRaw.map((m) => [m._id, m]));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = months.map((label, i) => {
    const m = monthMap.get(i + 1);
    return { month: label, revenue: m ? Math.round(m.revenue * 100) / 100 : 0, count: m ? m.count : 0 };
  });

  // Status breakdown.
  const statusBreakdownRaw = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
  ]);
  const statusBreakdown = statusBreakdownRaw.map((s) => ({
    status: s._id,
    count: s.count,
    total: Math.round(s.total * 100) / 100,
  }));

  // Top clients by billed amount.
  const topClients = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: '$client', totalBilled: { $sum: '$total' }, invoiceCount: { $sum: 1 } } },
    { $sort: { totalBilled: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        clientId: '$_id',
        name: '$client.name',
        company: '$client.company',
        totalBilled: { $round: ['$totalBilled', 2] },
        invoiceCount: 1,
      },
    },
  ]);

  // Distinct years for the year filter dropdown.
  const yearsRaw = await Invoice.aggregate([
    { $group: { _id: { $year: '$issueDate' } } },
    { $sort: { _id: -1 } },
  ]);
  const years = yearsRaw.map((y) => y._id).filter(Boolean);

  res.json({
    summary: {
      totalRevenue: totals ? Math.round(totals.totalRevenue * 100) / 100 : 0,
      paid: totals ? Math.round(totals.paid * 100) / 100 : 0,
      outstanding: totals ? Math.round(totals.outstanding * 100) / 100 : 0,
      invoiceCount: totals ? totals.invoiceCount : 0,
    },
    monthlyRevenue,
    statusBreakdown,
    topClients,
    years,
  });
};
