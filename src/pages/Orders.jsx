import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import OrderFilters from "../components/orders/OrderFilters";
import OrdersTable from "../components/orders/OrdersTable";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState("updated_date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    base44.entities.Order.list("-updated_date", 500).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...orders];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(o =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.contact_number?.includes(q)
      );
    }
    if (filters.status) result = result.filter(o => o.order_status === filters.status);
    if (filters.source) result = result.filter(o => o.order_source === filters.source);
    if (filters.department) result = result.filter(o => o.team_department === filters.department);

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      aVal = String(aVal || "");
      bVal = String(bVal || "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [orders, filters, sortField, sortDir]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Orders" description={`${filtered.length} orders`}>
        <Link to="/orders/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </Link>
      </PageHeader>

      <OrderFilters filters={filters} setFilters={setFilters} />
      <OrdersTable
        orders={paginated}
        sortField={sortField}
        sortDir={sortDir}
        onSort={(field, dir) => { setSortField(field); setSortDir(dir); }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}