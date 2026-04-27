import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, DollarSign, Truck, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUSES, ORDER_SOURCES, TEAM_DEPARTMENTS } from "../lib/statusConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["#06b6d4", "#22c55e", "#ec4899", "#ef4444", "#d946ef", "#9ca3af", "#eab308", "#f97316"];

const PRESETS = [
  { key: "today",     label: "Today" },
  { key: "week",      label: "Last 7 days" },
  { key: "month",     label: "This month" },
  { key: "all",       label: "All time" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
const monthStartStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};

const orderDate = (o) => o.order_day || (o.created_date ? o.created_date.split("T")[0] : "");

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState(monthStartStr());
  const [to, setTo] = useState(todayStr());

  useEffect(() => {
    base44.entities.Order.list("-created_date", 1000).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const applyPreset = (key) => {
    setPreset(key);
    if (key === "today")      { setFrom(todayStr());      setTo(todayStr()); }
    else if (key === "week")  { setFrom(daysAgoStr(6));   setTo(todayStr()); }
    else if (key === "month") { setFrom(monthStartStr()); setTo(todayStr()); }
    else if (key === "all")   { setFrom("");              setTo(""); }
  };

  const inRange = (o) => {
    if (!from && !to) return true;
    const d = orderDate(o);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const filtered = useMemo(() => orders.filter(inRange), [orders, from, to]);

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);
  const todayOrders = orders.filter(o => orderDate(o) === todayStr());

  const statusCounts = ORDER_STATUSES.map(s => ({
    name: s.value,
    count: filtered.filter(o => o.order_status === s.value).length,
  }));

  const sourceCounts = ORDER_SOURCES.map(s => ({
    name: s,
    count: filtered.filter(o => o.order_source === s).length,
    revenue: filtered.filter(o => o.order_source === s).reduce((sum, o) => sum + (o.amount || 0), 0),
  })).filter(s => s.count > 0);

  const deptCounts = TEAM_DEPARTMENTS.map(d => ({
    name: d,
    count: filtered.filter(o => o.team_department === d).length,
  })).filter(d => d.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="Overview of your business performance" />

      {/* Date filter */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <Button
                key={p.key}
                size="sm"
                variant={preset === p.key ? "default" : "outline"}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-end gap-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</Label>
              <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset("custom"); }} className="h-9 w-[150px]" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</Label>
              <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset("custom"); }} className="h-9 w-[150px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Revenue (selected)" value={`₱${totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-600" />
        <MetricCard title="Orders (selected)" value={filtered.length} icon={Truck} />
        <MetricCard title="Today's Orders" value={todayOrders.length} icon={ShoppingCart} />
        <MetricCard title="Active Statuses" value={statusCounts.filter(s => s.count > 0).length} icon={BarChart3} color="text-blue-600" />
      </div>

      {/* Status breakdown */}
      <div className="bg-card rounded-xl border p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4">Orders by Status</h3>
        <div className="flex flex-wrap gap-3">
          {statusCounts.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <StatusBadge status={s.name} />
              <span className="text-sm font-semibold">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₱${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(225 73% 57%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Orders by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {deptCounts.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
