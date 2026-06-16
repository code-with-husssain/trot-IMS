const Expense = require('../models/Expense');
const { round2, recurringActiveInMonth } = require('../utils/expenseUtils');

// GET /api/expenses?year=&month=&category=
// `month` is 1-based. When year+month given, returns that month's one-offs PLUS any recurring
// templates active that month (each normalized with effectiveDate + isRecurring).
exports.list = async (req, res) => {
  const { year, month, category } = req.query;
  const catFilter = category ? { category } : {};

  // Recurring templates are returned whenever they're active in the requested month.
  const recurringDocs = await Expense.find({ recurring: true, ...catFilter }).sort({ startDate: -1 });

  let oneOffFilter = { recurring: false, ...catFilter };
  if (year && month) {
    const y = Number(year);
    const m = Number(month) - 1; // 0-based
    oneOffFilter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
  } else if (year) {
    const y = Number(year);
    oneOffFilter.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
  }
  const oneOffs = await Expense.find(oneOffFilter).sort({ date: -1 });

  const items = oneOffs.map((e) => ({ ...e.toObject(), effectiveDate: e.date, isRecurring: false }));

  // Expand recurring templates for the selected month (only when a specific month is requested).
  if (year && month) {
    const y = Number(year);
    const m = Number(month) - 1;
    for (const r of recurringDocs) {
      if (recurringActiveInMonth(r, y, m)) {
        items.push({
          ...r.toObject(),
          effectiveDate: new Date(y, m, 1),
          isRecurring: true,
        });
      }
    }
  }

  items.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
  const total = round2(items.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));

  res.json({ expenses: items, recurring: recurringDocs, total });
};

exports.create = async (req, res) => {
  const { description, amount, recurring } = req.body || {};
  if (!description || amount == null) {
    return res.status(400).json({ message: 'Description and amount are required' });
  }
  const body = { ...req.body, amount: Number(amount) };
  if (recurring) {
    if (!body.startDate) return res.status(400).json({ message: 'Recurring expense needs a start date' });
    body.date = undefined;
  } else {
    if (!body.date) body.date = new Date();
    body.startDate = undefined;
    body.endDate = undefined;
  }
  const expense = await Expense.create(body);
  res.status(201).json({ expense });
};

exports.update = async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ expense });
};

exports.remove = async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
};

// GET /api/expenses/categories — presets merged with any custom categories already used.
exports.categories = async (req, res) => {
  const used = await Expense.distinct('category');
  const merged = Array.from(new Set([...Expense.CATEGORIES, ...used.filter(Boolean)]));
  res.json({ categories: merged });
};
