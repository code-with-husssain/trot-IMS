// Shared helpers for expanding recurring expenses across months.

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// First instant of a month and first instant of the next month (0-based monthIndex).
function monthBounds(year, monthIndex) {
  return { start: new Date(year, monthIndex, 1), nextStart: new Date(year, monthIndex + 1, 1) };
}

// Is a recurring expense's [startDate, endDate?] window active during the given month?
function recurringActiveInMonth(exp, year, monthIndex) {
  if (!exp.startDate) return false;
  const { start, nextStart } = monthBounds(year, monthIndex);
  const startsBeforeMonthEnds = new Date(exp.startDate) < nextStart;
  const endsAfterMonthStarts = !exp.endDate || new Date(exp.endDate) >= start;
  return startsBeforeMonthEnds && endsAfterMonthStarts;
}

module.exports = { round2, monthBounds, recurringActiveInMonth };
