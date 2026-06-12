import { statusClasses } from '../lib/format';

export default function StatusBadge({ status }) {
  const cls = statusClasses[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}
