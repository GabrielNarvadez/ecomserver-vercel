import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, DollarSign, Truck, Users } from "lucide-react";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { ORDER_STATUSES, ORDER_SOURCES, TEAM_DEPARTMENTS } from "../lib/statusConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["#06b6d4", "#22c55e", "#ec4899", "#ef4444", "#d946ef", "#9ca3af", "#eab308", "#f97316"];

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.list("-created_date", 500).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => o.order_day === today || o.created_date?.startsWith(today));
  const totalSales = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const statusCounts = ORDER_STATUSES.map(s => ({
    name: s.value,
    count: orders.filter(o => o.order_status === s.value).length,
  }));

  const sourceCounts = ORDER_SOURCES.map(s => ({
    name: s,
    count: orders.filter(o => o.order_source === s).length,
  })).filter(s => s.count > 0);

  const deptCounts = TEAM_DEPARTMENTS.map(d => ({
    name: d,
    count: orders.filter(o => o.team_department === d).length,
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Today's Orders" value={todayOrders.length} icon={ShoppingCart} />
        <MetricCard title="Total Orders" value={orders.length} icon={Truck} />
        <MetricCard title="Total Sales" value={`₱${totalSales.toLocaleString()}`} icon={DollarSign} color="text-green-600" />
        <MetricCard title="Active Statuses" value={statusCounts.filter(s => s.count > 0).length} icon={Users} color="text-blue-600" />
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
        {/* Orders by Source */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Orders by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(225 73% 57%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Department */}
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