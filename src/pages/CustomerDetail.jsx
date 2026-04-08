import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";
import moment from "moment";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState({
    name: "", contact_number: "", complete_address: "", landmark: "",
    facebook_link: "", facebook_page: "", tags: [],
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!isNew) {
      Promise.all([
        base44.entities.Customer.filter({ id }),
        base44.entities.Order.list("-created_date", 500),
      ]).then(([cust, allOrders]) => {
        if (cust.length > 0) {
          setForm(cust[0]);
          setOrders(allOrders.filter(o => o.customer_id === id || o.customer_name === cust[0].name));
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      set("tags", [...(form.tags || []), tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => set("tags", (form.tags || []).filter(t => t !== tag));

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.created_date;
    delete payload.updated_date;
    delete payload.created_by;

    if (isNew) {
      await base44.entities.Customer.create(payload);
      toast.success("Customer created");
    } else {
      await base44.entities.Customer.update(id, payload);
      toast.success("Customer updated");
    }
    setSaving(false);
    navigate("/customers");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this customer?")) return;
    await base44.entities.Customer.delete(id);
    toast.success("Customer deleted");
    navigate("/customers");
  };

  const totalPurchase = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title={isNew ? "New Customer" : form.name}>
        <Link to="/customers">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </PageHeader>

      <div className="space-y-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name *</Label>
              <Input value={form.name || ""} onChange={e => set("name", e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact Number</Label>
              <Input value={form.contact_number || ""} onChange={e => set("contact_number", e.target.value)} className="h-9" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Complete Address</Label>
              <Input value={form.complete_address || ""} onChange={e => set("complete_address", e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Landmark</Label>
              <Input value={form.landmark || ""} onChange={e => set("landmark", e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Facebook Link</Label>
              <Input value={form.facebook_link || ""} onChange={e => set("facebook_link", e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Facebook Page</Label>
              <Input value={form.facebook_page || ""} onChange={e => set("facebook_page", e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags || []).map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                className="h-8 max-w-[200px]"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
            </div>
          </div>
        </div>

        {/* Orders */}
        {!isNew && (
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Orders ({orders.length})</h3>
              <span className="text-sm font-bold text-primary">Total: ₱{totalPurchase.toLocaleString()}</span>
            </div>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(o => (
                      <TableRow key={o.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate(`/orders/${o.id}`)}>
                        <TableCell>{o.order_product}</TableCell>
                        <TableCell className="text-right font-medium">₱{(o.amount || 0).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={o.order_status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{moment(o.order_day || o.created_date).format("MMM D, YYYY")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : isNew ? "Create Customer" : "Save Changes"}
          </Button>
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}