import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import CsvImport from "../components/CsvImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import { toast } from "sonner";

const blankForm = { product_name: "", sku: "", price: 0, stocks: 0, status: "Active" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [selected, setSelected] = useState(new Set());

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(prev => {
      const allOn = products.length > 0 && products.every(p => prev.has(p.id));
      if (allOn) return new Set();
      return new Set(products.map(p => p.id));
    });
  };
  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} product${ids.length > 1 ? "s" : ""}?`)) return;
    await Promise.all(ids.map(id => base44.entities.Product.delete(id)));
    toast.success(`Deleted ${ids.length} product${ids.length > 1 ? "s" : ""}`);
    clearSelection();
    load();
  };

  const handleBulkStatus = async (status) => {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(ids.map(id => base44.entities.Product.update(id, { status })));
    toast.success(`Set ${ids.length} product${ids.length > 1 ? "s" : ""} to ${status}`);
    clearSelection();
    load();
  };

  const load = () => base44.entities.Product.list("-created_date", 500).then(data => { setProducts(data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(blankForm); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ product_name: p.product_name, sku: p.sku, price: p.price, stocks: p.stocks ?? 0, status: p.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await base44.entities.Product.update(editing.id, form);
      toast.success("Product updated");
    } else {
      await base44.entities.Product.create(form);
      toast.success("Product created");
    }
    setDialogOpen(false);
    load();
  };

  const handleStocksChange = async (p, newStocks) => {
    const stocks = Number(newStocks);
    if (Number.isNaN(stocks) || stocks === p.stocks) return;
    await base44.entities.Product.update(p.id, { stocks });
    toast.success(`Stocks updated for ${p.product_name}`);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await base44.entities.Product.delete(id);
    toast.success("Product deleted");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader title="Products" description={`${products.length} products`}>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" /> New Product
        </Button>
      </PageHeader>
      <CsvImport
        open={importOpen}
        onClose={() => { setImportOpen(false); load(); }}
        entityName="Product"
        fields={[
          { key: "product_name", label: "Product Name", required: true },
          { key: "sku", label: "SKU" },
          { key: "price", label: "Price" },
          { key: "stocks", label: "Stocks" },
          { key: "status", label: "Status" },
        ]}
        sampleHeaders={["product_name","sku","price","stocks","status"]}
        onImport={record => base44.entities.Product.create({
          ...record,
          price: Number(record.price) || 0,
          stocks: Number(record.stocks) || 0,
          status: record.status || "Active"
        })}
      />

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 rounded-lg bg-secondary/70 border">
          <span className="text-sm font-medium px-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("Active")}>Set Active</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("Inactive")}>Set Inactive</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      products.length > 0 && products.every(p => selected.has(p.id))
                        ? true
                        : products.some(p => selected.has(p.id))
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stocks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No products</TableCell>
                </TableRow>
              ) : (
                products.map(p => (
                  <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined} className="data-[state=selected]:bg-accent/60">
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selected.has(p.id) || false}
                        onCheckedChange={() => toggleRow(p.id)}
                        aria-label={`Select ${p.product_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="text-right font-medium">₱{(p.price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        defaultValue={p.stocks ?? 0}
                        onBlur={(e) => handleStocksChange(p, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                        className="h-8 w-20 ml-auto text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product Name *</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">SKU</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (₱)</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="h-9" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stocks</Label>
                <Input type="number" value={form.stocks} onChange={e => setForm(f => ({ ...f, stocks: Number(e.target.value) }))} className="h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
