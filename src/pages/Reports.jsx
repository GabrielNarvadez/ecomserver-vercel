import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUSES, ORDER_SOURCES } from "../lib/statusConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#06b6d4", "#22c55e", "#ec4899", "#ef4444", "#d946ef", "#9ca3af", "#eab308", "#f97316", "#8b5cf6"];

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "all",   label: "All time" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
const monthStartStr = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]; };
const orderDate = (o) => o.order_day || (o.created_date ? o.created_date.split("T")[0] : "");

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState(monthStartStr());
  const [to, setTo] = useState(todayStr());

  useEffect(() => {
    base44.entities.Order.list("-created_date", 1000).then(o => {
      setOrders(o);
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

  const totalRevenue = filtered.reduce((s, o) => s + (o.amount || 0), 0);

  const statusData = useMemo(() =>
    ORDER_STATUSES.map(s => ({
      name: s.value,
      count: filtered.filter(o => o.order_status === s.value).length,
      revenue: filtered.filter(o => o.order_status === s.value).reduce((sum, o) => sum + (o.amount || 0), 0),
    })).filter(s => s.count > 0),
    [filtered]
  );

  const sourceData = useMemo(() =>
    ORDER_SOURCES.map(s => ({
      name: s,
      count: filtered.filter(o => o.order_source === s).length,
      revenue: filtered.filter(o => o.order_source === s).reduce((sum, o) => sum + (o.amount || 0), 0),
    })).filter(s => s.count > 0),
    [filtered]
  );

  const topAgents = useMemo(() => {
    const map = {};
    filtered.forEach(o => {
      const key = o.agent_name || "Unassigned";
      if (!map[key]) map[key] = { name: key, revenue: 0, orders: 0 };
      map[key].revenue += o.amount || 0;
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Reports" description="Sales and performance analytics" />

      {/* Date filter */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <Button key={p.key} size="sm" variant={preset === p.key ? "default" : "outline"} onClick={() => applyPreset(p.key)}>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
          <p className="text-3xl font-bold mt-1 text-primary">₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders</p>
          <p className="text-3xl font-bold mt-1">{filtered.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
          <p className="text-3xl font-bold mt-1">₱{filtered.length ? Math.round(totalRevenue / filtered.length).toLocaleString() : 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `₱${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(225 73% 57%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Orders by Source</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold mb-4">Top Agents by Revenue</h3>
        <div className="space-y-2">
          {topAgents.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
                <span className="text-sm font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.orders} orders</span>
              </div>
              <span className="text-sm font-bold">₱{a.revenue.toLocaleString()}</span>
            </div>
          ))}
          {topAgents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data in selected range</p>}
        </div>
      </div>
    </div>
  );
}
