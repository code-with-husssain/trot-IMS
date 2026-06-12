const mongoose = require('mongoose');

const INVOICE_STATUSES = [
  'pending',
  'approved',
  'received',
  'paid',
  'overdue',
  'cancelled',
];

const lineItemSchema = new mongoose.Schema(
  {
    service: { type: String, required: true, trim: true },
    totalHours: { type: Number, required: true, min: 0 },
    ratePerHour: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: INVOICE_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // padded e.g. "00024"
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    paymentTermsDays: { type: Number, default: 15 },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: INVOICE_STATUSES, default: 'pending' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    companyInfo: {
      name: { type: String, default: 'Trot Tk' },
      tagline: { type: String, default: 'Development partner for fast growing SaaS & tech startups' },
      address: {
        type: String,
        default: 'Block 3rd floor, 33 B, Bankers Cooperative Housing Society Lahore, 54792, Pakistan',
      },
      email: { type: String, default: 'support@trottk.com' },
    },
  },
  { timestamps: true }
);

invoiceSchema.statics.STATUSES = INVOICE_STATUSES;

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
module.exports.STATUSES = INVOICE_STATUSES;
