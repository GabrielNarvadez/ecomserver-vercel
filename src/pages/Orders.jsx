import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Upload, Download, Trash2, Pencil } from "lucide-react";
import CsvImport from "../components/CsvImport";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import OrderFilters from "../components/orders/OrderFilters";
import OrdersTable from "../components/orders/OrdersTable";
import { ORDER_STATUSES, ORDER_SOURCES, TEAM_DEPARTMENTS, PAYMENT_MODES } from "../lib/statusConfig";
import { toast } from "sonner";

const EXPORT_COLUMNS = [
  "order_day", "customer_name", "contact_number", "complete_address", "facebook_link",
  "order_product", "order_quantity", "amount", "order_status", "mode_of_payment", "order_source",
  "team_department", "agent_name", "agent_notes", "admin_notes", "q_a_notes"
];

const csvCell = (v) => {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

const downloadCsv = (rows, filename) => {
  const header = EXPORT_COLUMNS.join(",");
  const body = rows.map(r => EXPORT_COLUMNS.map(c => csvCell(r[c])).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const blankBulkForm = {
  order_status: "",
  order_source: "",
  team_department: "",
  mode_of_payment: "",
  agent_name: "",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState("order_day");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState(blankBulkForm);
  const [bulkSaving, setBulkSaving] = useState(false);
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
    if (filters.payment) result = result.filter(o => o.mode_of_payment === filters.payment);

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

  const handleExport = () => {
    const stamp = new Date().toISOString().split("T")[0];
    downloadCsv(filtered, `orders-${stamp}.csv`);
  };

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (rows) => {
    setSelected(prev => {
      const allOn = rows.every(o => prev.has(o.id));
      const next = new Set(prev);
      if (allOn) rows.forEach(o => next.delete(o.id));
      else rows.forEach(o => next.add(o.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} order${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    await Promise.all(ids.map(id => base44.entities.Order.delete(id)));
    toast.success(`Deleted ${ids.length} order${ids.length > 1 ? "s" : ""}`);
    clearSelection();
    load();
  };

  const openBulkEdit = () => { setBulkForm(blankBulkForm); setBulkOpen(true); };

  const handleBulkSave = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const payload = Object.fromEntries(
      Object.entries(bulkForm).filter(([, v]) => v !== "" && v != null)
    );
    if (!Object.keys(payload).length) {
      toast.error("Set at least one field to update");
      return;
    }
    setBulkSaving(true);
    try {
      await Promise.all(ids.map(id => base44.entities.Order.update(id, payload)));
      toast.success(`Updated ${ids.length} order${ids.length > 1 ? "s" : ""}`);
      setBulkOpen(false);
      clearSelection();
      load();
    } catch (e) {
      toast.error(e.message || "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Orders" description={`${filtered.length} orders`}>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
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
          { key: "facebook_link", label: "Facebook Link" },
          { key: "order_product", label: "Order Product" },
          { key: "order_quantity", label: "Order Quantity" },
          { key: "amount", label: "Amount" },
          { key: "order_status", label: "Order Status" },
          { key: "mode_of_payment", label: "Mode of Payment (COD/COP)" },
          { key: "order_source", label: "Order Source" },
          { key: "team_department", label: "Team Department" },
          { key: "agent_name", label: "Agent Name" },
          { key: "order_day", label: "Order Day" },
        ]}
        sampleHeaders={["customer_name","contact_number","complete_address","facebook_link","order_product","order_quantity","amount","order_status","mode_of_payment","order_source","team_department","agent_name","order_day"]}
        onImport={record => base44.entities.Order.create({ ...record, order_quantity: Number(record.order_quantity) || 1, amount: Number(record.amount) || 0, order_status: record.order_status || "On Going" })}
      />

      <OrderFilters filters={filters} setFilters={setFilters} />

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 rounded-lg bg-secondary/70 border">
          <span className="text-sm font-medium px-2">{selectedCount} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openBulkEdit}>
            <Pencil className="h-3.5 w-3.5" /> Bulk Edit
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
        </div>
      )}

      <OrdersTable
        orders={paginated}
        sortField={sortField}
        sortDir={sortDir}
        onSort={(field, dir) => { setSortField(field); setSortDir(dir); }}
        selected={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
      />

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

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk edit {selectedCount} order{selectedCount > 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">Only fields you set will be updated. Leave blank to keep existing values.</p>

            <BulkSelect
              label="Order Status"
              value={bulkForm.order_status}
              onChange={v => setBulkForm(f => ({ ...f, order_status: v }))}
              options={ORDER_STATUSES.map(s => s.value)}
            />
            <BulkSelect
              label="Order Source"
              value={bulkForm.order_source}
              onChange={v => setBulkForm(f => ({ ...f, order_source: v }))}
              options={ORDER_SOURCES}
            />
            <BulkSelect
              label="Team Department"
              value={bulkForm.team_department}
              onChange={v => setBulkForm(f => ({ ...f, team_department: v }))}
              options={TEAM_DEPARTMENTS}
            />
            <BulkSelect
              label="Mode of Payment"
              value={bulkForm.mode_of_payment}
              onChange={v => setBulkForm(f => ({ ...f, mode_of_payment: v }))}
              options={PAYMENT_MODES}
            />

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agent Name</Label>
              <Input
                value={bulkForm.agent_name}
                onChange={e => setBulkForm(f => ({ ...f, agent_name: e.target.value }))}
                className="h-9"
                placeholder="(leave blank to skip)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)} disabled={bulkSaving}>Cancel</Button>
            <Button onClick={handleBulkSave} disabled={bulkSaving}>
              {bulkSaving ? "Updating..." : `Update ${selectedCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BulkSelect({ label, value, onChange, options }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <Select value={value || "none"} onValueChange={v => onChange(v === "none" ? "" : v)}>
        <SelectTrigger className="h-9"><SelectValue placeholder="(skip)" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">(skip)</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
