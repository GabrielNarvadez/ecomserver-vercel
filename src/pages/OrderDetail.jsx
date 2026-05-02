import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { ORDER_STATUSES, ORDER_SOURCES, TEAM_DEPARTMENTS, PAYMENT_MODES } from "../lib/statusConfig";
import moment from "moment";
import { toast } from "sonner";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState({
    customer_name: "", contact_number: "", complete_address: "", landmark: "",
    facebook_link: "", facebook_page: "",
    order_day: new Date().toISOString().split("T")[0],
    ship_out_day: "",
    order_product: "", order_quantity: 1, amount: 0, order_type: "",
    order_source: "", team_department: "", order_status: "NEW", mode_of_payment: "",
    agent_name: "", agent_facebook: "", agent_notes: "", admin_notes: "",
    q_a_notes: "",
    customer_id: "", edit_history: [], admin_name: "",
  });
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
    base44.entities.Product.list("-created_date", 500).then(setProducts);
    if (!isNew) {
      base44.entities.Order.filter({ id }).then(data => {
        if (data.length > 0) setForm(data[0]);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const isAdmin = user?.role === "admin";

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.customer_name?.trim()) { toast.error("Customer Name is required"); return; }
    if (!form.contact_number?.trim()) { toast.error("Contact Number is required"); return; }
    if (!form.order_product?.trim()) { toast.error("Order Product is required"); return; }
    if (!form.order_quantity || form.order_quantity < 1) { toast.error("Order Quantity is required"); return; }
    if (!form.order_source) { toast.error("Order Source is required"); return; }

    const matchedProduct = products.find(p => p.product_name?.toLowerCase() === form.order_product?.toLowerCase());
    const order_total = matchedProduct?.price
      ? (form.order_quantity || 1) * matchedProduct.price
      : (form.amount || 0);

    setSaving(true);
    const payload = {
      ...form,
      order_total,
      last_updated_by: user?.full_name || user?.email,
      admin_name: isAdmin ? (user?.full_name || user?.email) : (form.admin_name || ""),
      edit_history: [
        ...(form.edit_history || []),
        { updated_by: user?.full_name || user?.email, updated_at: new Date().toISOString(), field: "saved", old_value: "", new_value: "" }
      ]
    };
    if (!payload.ship_out_day) payload.ship_out_day = null;
    delete payload.id;
    delete payload.created_date;
    delete payload.updated_date;
    delete payload.created_by;

    if (isNew) {
      await base44.entities.Order.create(payload);
      toast.success("Order created");
    } else {
      await base44.entities.Order.update(id, payload);
      toast.success("Order updated");
    }
    setSaving(false);
    navigate("/orders");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this order?")) return;
    await base44.entities.Order.delete(id);
    toast.success("Order deleted");
    navigate("/orders");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title={isNew ? "New Order" : `Order #${id?.slice(-6)?.toUpperCase()}`}>
        <Link to="/orders">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </PageHeader>

      {!isNew && (
        <div className="flex items-center gap-3 mb-6">
          <StatusBadge status={form.order_status} />
          {form.last_updated_by && (
            <span className="text-xs text-muted-foreground">
              Last updated by {form.last_updated_by} • {moment(form.updated_date).fromNow()}
            </span>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Details */}
        <Section title="Customer Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" value={form.customer_name} onChange={v => set("customer_name", v)} required />
            <Field label="Contact Number" value={form.contact_number} onChange={v => set("contact_number", v)} />
            <Field label="Complete Address" value={form.complete_address} onChange={v => set("complete_address", v)} className="sm:col-span-2" />
            <Field label="Landmark" value={form.landmark} onChange={v => set("landmark", v)} />
            <Field label="Facebook Link" value={form.facebook_link} onChange={v => set("facebook_link", v)} />
            <Field label="Facebook Page" value={form.facebook_page} onChange={v => set("facebook_page", v)} />
          </div>
        </Section>

        {/* Order Details */}
        <Section title="Order Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Order Day" type="date" value={form.order_day} onChange={v => set("order_day", v)} />
            <Field label="Ship Out Day" type="date" value={form.ship_out_day} onChange={v => set("ship_out_day", v)} />
            <Field label="Product" value={form.order_product} onChange={v => set("order_product", v)} />
            <Field label="Quantity" type="number" value={form.order_quantity} onChange={v => set("order_quantity", Number(v))} />
            <Field label="Amount (₱)" type="number" value={form.amount} onChange={v => set("amount", Number(v))} />
            <Field label="Order Type" value={form.order_type} onChange={v => set("order_type", v)} />

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Order Source</Label>
              <Select value={form.order_source || "none"} onValueChange={v => set("order_source", v === "none" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {ORDER_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team Department</Label>
              <Select value={form.team_department || "none"} onValueChange={v => set("team_department", v === "none" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {TEAM_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Order Status</Label>
              <Select value={form.order_status || "NEW"} onValueChange={v => set("order_status", v)} disabled={!isAdmin && !isNew}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mode of Payment</Label>
              <Select value={form.mode_of_payment || "none"} onValueChange={v => set("mode_of_payment", v === "none" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Agent Details */}
        <Section title="Agent Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Agent Name" value={form.agent_name} onChange={v => set("agent_name", v)} />
            <Field label="Agent Facebook" value={form.agent_facebook} onChange={v => set("agent_facebook", v)} />
            {isAdmin && <Field label="Admin Name" value={form.admin_name} onChange={v => set("admin_name", v)} />}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agent Notes</Label>
              <Textarea
                value={form.agent_notes || ""}
                onChange={e => set("agent_notes", e.target.value)}
                rows={3}
                placeholder="Add agent notes..."
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Admin Notes {!isAdmin && "(Admin only)"}</Label>
              <Textarea
                value={form.admin_notes || ""}
                onChange={e => set("admin_notes", e.target.value)}
                rows={3}
                placeholder="Add admin notes..."
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Q.A Notes {!isAdmin && "(Admin only)"}</Label>
              <Textarea
                value={form.q_a_notes || ""}
                onChange={e => set("q_a_notes", e.target.value)}
                rows={3}
                placeholder="Add Q.A notes..."
                disabled={!isAdmin}
              />
            </div>
          </div>
        </Section>

        {/* Edit History */}
        {!isNew && form.edit_history?.length > 0 && (
          <Section title="Activity Log">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...form.edit_history].reverse().map((entry, i) => (
                <div key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="font-medium text-foreground">{entry.updated_by}</span>
                  <span>•</span>
                  <span>{moment(entry.updated_at).format("MMM D, YYYY h:mm A")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : isNew ? "Create Order" : "Save Changes"}
          </Button>
          {!isNew && isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className = "", required, disabled }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}{required && " *"}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="h-9"
        disabled={disabled}
      />
    </div>
  );
}
