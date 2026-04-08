import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import { ORDER_STATUSES, ORDER_SOURCES } from "../lib/statusConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#06b6d4", "#22c55e", "#ec4899", "#ef4444", "#d946ef", "#9ca3af", "#eab308", "#f97316", "#8b5cf6"];

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list("-created_date", 1000),
      base44.entities.Customer.list("-created_date", 500),
    ]).then(([o, c]) => {
      setOrders(o);
      setCustomers(c);
      setLoading(false);
    });
  }, []);

  const totalSales = orders.reduce((s, o) => s + (o.amount || 0), 0);

  const statusData = useMemo(() =>
    ORDER_STATUSES.map(s => ({
      name: s.value,
      count: orders.filter(o => o.order_status === s.value).length,
      amount: orders.filter(o => o.order_status === s.value).reduce((sum, o) => sum + (o.amount || 0), 0),
    })).filter(s => s.count > 0),
    [orders]
  );

  const sourceData = useMemo(() =>
    ORDER_SOURCES.map(s => ({
      name: s,
      count: orders.filter(o => o.order_source === s).length,
      amount: orders.filter(o => o.order_source === s).reduce((sum, o) => sum + (o.amount || 0), 0),
    })).filter(s => s.count > 0),
    [orders]
  );

  const topCustomers = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.customer_name || "Unknown";
      if (!map[key]) map[key] = { name: key, total: 0, orders: 0 };
      map[key].total += o.amount || 0;
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [orders]);

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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sales</p>
          <p className="text-3xl font-bold mt-1 text-primary">₱{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Orders</p>
          <p className="text-3xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Customers</p>
          <p className="text-3xl font-bold mt-1">{customers.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by Status */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Orders by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Source */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Sales by Source</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `₱${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="hsl(225 73% 57%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold mb-4">Top Customers by Sales</h3>
        <div className="space-y-2">
          {topCustomers.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.orders} orders</span>
              </div>
              <span className="text-sm font-bold">₱{c.total.toLocaleString()}</span>
            </div>
          ))}
          {topCustomers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
        </div>
      </div>
    </div>
  );
}