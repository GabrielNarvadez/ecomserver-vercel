export default function MetricCard({ title, value, icon: Icon, color = "text-primary" }) {
  return (
    <div className="bg-card rounded-xl border p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg bg-accent`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}