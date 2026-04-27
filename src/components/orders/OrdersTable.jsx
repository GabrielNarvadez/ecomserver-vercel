import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import moment from "moment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLUMNS = [
  { field: "order_day",        label: "Date" },
  { field: "customer_name",    label: "Customer" },
  { field: "contact_number",   label: "Contact" },
  { field: "complete_address", label: "Address" },
  { field: "facebook_link",    label: "Facebook Link" },
  { field: "order_product",    label: "Product" },
  { field: "order_quantity",   label: "Qty",      align: "right" },
  { field: "amount",           label: "Amount",   align: "right" },
  { field: "order_status",     label: "Status" },
  { field: "order_source",     label: "Source" },
  { field: "team_department",  label: "Department" },
  { field: "agent_name",       label: "Agent" },
  { field: "agent_notes",      label: "Agent Notes" },
  { field: "admin_notes",      label: "Admin Notes" },
  { field: "q_a_notes",        label: "Q.A Notes" },
];

const truncate = (s, n = 40) => (s && s.length > n ? `${s.slice(0, n)}…` : s || "");

export default function OrdersTable({ orders, sortField, sortDir, onSort }) {
  const navigate = useNavigate();

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const headClick = (field) => {
    if (sortField === field) onSort(field, sortDir === "asc" ? "desc" : "asc");
    else onSort(field, "desc");
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              {COLUMNS.map(c => (
                <TableHead
                  key={c.field}
                  className={`cursor-pointer whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}
                  onClick={() => headClick(c.field)}
                >
                  {c.label}{sortIcon(c.field)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground py-12">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map(order => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {order.order_day ? moment(order.order_day).format("MMM D, YYYY") : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.contact_number}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[180px]" title={order.complete_address}>
                    {truncate(order.complete_address, 30)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[140px]">
                    {order.facebook_link ? (
                      <a href={order.facebook_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        {truncate(order.facebook_link.replace(/^https?:\/\/(www\.)?/, ""), 22)}
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{order.order_product}</TableCell>
                  <TableCell className="text-right">{order.order_quantity}</TableCell>
                  <TableCell className="text-right font-medium">₱{(order.amount || 0).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={order.order_status} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.order_source}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.team_department}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.agent_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[160px]" title={order.agent_notes}>
                    {truncate(order.agent_notes, 30)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[160px]" title={order.admin_notes}>
                    {truncate(order.admin_notes, 30)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[160px]" title={order.q_a_notes}>
                    {truncate(order.q_a_notes, 30)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
