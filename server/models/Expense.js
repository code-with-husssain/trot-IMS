const mongoose = require('mongoose');

// Preset categories; users may also enter a custom string.
const CATEGORIES = [
  'Salaries',
  'Software/Tools',
  'Hardware/Equipment',
  'Office/Rent',
  'Utilities',
  'Bills',
  'Subscriptions',
  'Marketing',
  'Travel',
  'Taxes',
  'Misc',
];

const expenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: 'Misc' },
    vendor: { type: String, trim: true },
    currency: { type: String, default: 'USD' },
    notes: { type: String, trim: true },

    recurring: { type: Boolean, default: false },
    // One-off expenses use `date`. Recurring expenses use `startDate` (+ optional `endDate`)
    // and are counted once per calendar month their active window covers.
    date: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

expenseSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
