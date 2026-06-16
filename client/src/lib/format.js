export const money = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n) || 0);

export const dateLong = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

export const dateShort = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export const STATUS_OPTIONS = [
  'pending',
  'approved',
  'received',
  'paid',
  'overdue',
  'cancelled',
];

export const EXPENSE_CATEGORIES = [
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

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  received: 'bg-teal-100 text-teal-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-600',
};
