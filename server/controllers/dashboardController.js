const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const { round2, recurringActiveInMonth } = require('../utils/expenseUtils');

const PAID_STATUSES = ['paid', 'received'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.metrics = async (req, res) => {
  const { clientId, year } = req.query;
  // Cash-flow is year-scoped; default to the current year when no filter is set.
  const scopeYear = year ? Number(year) : new Date().getFullYear();

  const match = {};
  if (clientId) match.client = new mongoose.Types.ObjectId(clientId);
  if (year) match.issueDate = { $gte: new Date(scopeYear, 0, 1), $lt: new Date(scopeYear + 1, 0, 1) };

  // ---- Invoice totals (respect client + year filters) ----
  const [totals] = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        invoiced: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
        received: { $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, '$total', 0] } },
        outstanding: { $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, 0, '$total'] } },
      },
    },
  ]);

  // ---- Per-month invoiced + received ----
  const monthlyInvoiceRaw = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $month: '$issueDate' },
        invoiced: { $sum: '$total' },
        received: { $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, '$total', 0] } },
      },
    },
  ]);
  const invMonthMap = new Map(monthlyInvoiceRaw.map((m) => [m._id, m]));

  // ---- Expenses for the scoped year (one-offs by month + recurring expanded) ----
  const expenseMonthly = Array(12).fill(0);
  const categoryTotals = {};
  const addCat = (cat, amt) => { categoryTotals[cat || 'Misc'] = (categoryTotals[cat || 'Misc'] || 0) + amt; };

  const oneOffs = await Expense.find({
    recurring: false,
    date: { $gte: new Date(scopeYear, 0, 1), $lt: new Date(scopeYear + 1, 0, 1) },
  });
  oneOffs.forEach((e) => {
    const m = new Date(e.date).getMonth();
    expenseMonthly[m] += e.amount;
    addCat(e.category, e.amount);
  });

  const recurring = await Expense.find({ recurring: true });
  for (let m = 0; m < 12; m++) {
    recurring.forEach((r) => {
      if (recurringActiveInMonth(r, scopeYear, m)) {
        expenseMonthly[m] += r.amount;
        addCat(r.category, r.amount);
      }
    });
  }

  // ---- Combined monthly series ----
  const monthly = MONTHS.map((label, i) => {
    const inv = invMonthMap.get(i + 1);
    const invoiced = round2(inv ? inv.invoiced : 0);
    const received = round2(inv ? inv.received : 0);
    const expenses = round2(expenseMonthly[i]);
    return { month: label, invoiced, received, expenses, net: round2(received - expenses) };
  });

  const totalExpenses = round2(expenseMonthly.reduce((a, b) => a + b, 0));
  const received = round2(totals ? totals.received : 0);

  const expenseByCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);

  // ---- Status breakdown ----
  const statusBreakdownRaw = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
  ]);
  const statusBreakdown = statusBreakdownRaw.map((s) => ({
    status: s._id,
    count: s.count,
    total: round2(s.total),
  }));

  // ---- Top clients ----
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

  // ---- Years for the filter dropdown (invoices + expenses) ----
  const invYears = await Invoice.aggregate([
    { $group: { _id: { $year: '$issueDate' } } },
  ]);
  const expYears = await Expense.aggregate([
    { $group: { _id: { $year: { $ifNull: ['$date', '$startDate'] } } } },
  ]);
  const years = Array.from(
    new Set([...invYears, ...expYears].map((y) => y._id).filter(Boolean))
  ).sort((a, b) => b - a);

  res.json({
    scopeYear,
    summary: {
      invoiced: round2(totals ? totals.invoiced : 0),
      received,
      outstanding: round2(totals ? totals.outstanding : 0),
      invoiceCount: totals ? totals.invoiceCount : 0,
      expenses: totalExpenses,
      net: round2(received - totalExpenses),
    },
    monthly,
    expenseByCategory,
    statusBreakdown,
    topClients,
    years,
  });
};
