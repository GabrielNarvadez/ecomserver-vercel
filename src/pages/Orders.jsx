import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Upload } from "lucide-react";
import CsvImport from "../components/CsvImport";
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
  const [importOpen, setImportOpen] = useState(false);
  const PAGE_SIZE = 50;

  const load = () => base44.entities.Order.list("-updated_date", 500).then(data => {
    setOrders(data);
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

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
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Link to="/orders/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </Link>
      </PageHeader>
      <CsvImport
        open={importOpen}
        onClose={() => { setImportOpen(false); load(); }}
        entityName="Order"
        fields={[
          { key: "customer_name", label: "Customer Name", required: true },
          { key: "contact_number", label: "Contact Number" },
          { key: "complete_address", label: "Complete Address" },
          { key: "order_product", label: "Order Product" },
          { key: "order_quantity", label: "Order Quantity" },
          { key: "amount", label: "Amount" },
          { key: "order_status", label: "Order Status" },
          { key: "order_source", label: "Order Source" },
          { key: "team_department", label: "Team Department" },
          { key: "agent_name", label: "Agent Name" },
          { key: "order_day", label: "Order Day" },
        ]}
        sampleHeaders={["customer_name","contact_number","complete_address","order_product","order_quantity","amount","order_status","order_source","team_department","agent_name","order_day"]}
        onImport={record => base44.entities.Order.create({ ...record, order_quantity: Number(record.order_quantity) || 1, amount: Number(record.amount) || 0, order_status: record.order_status || "On Going" })}
      />

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