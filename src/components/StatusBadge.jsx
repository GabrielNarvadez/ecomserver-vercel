import { getStatusStyle } from "../lib/statusConfig";

export default function StatusBadge({ status }) {
  const style = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {status}
    </span>
  );
}