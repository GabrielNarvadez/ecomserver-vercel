import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import moment from "moment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OrdersTable({ orders, sortField, sortDir, onSort }) {
  const navigate = useNavigate();

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const headClick = (field) => {
    if (sortField === field) {
      onSort(field, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "desc");
    }
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => headClick("id")}>
                Order ID{sortIcon("id")}
              </TableHead>
              <TableHead className="whitespace-nowrap">Customer</TableHead>
              <TableHead className="whitespace-nowrap">Contact</TableHead>
              <TableHead className="whitespace-nowrap">Product</TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => headClick("order_quantity")}>
                Qty{sortIcon("order_quantity")}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => headClick("amount")}>
                Amount{sortIcon("amount")}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => headClick("order_status")}>
                Status{sortIcon("order_status")}
              </TableHead>
              <TableHead className="whitespace-nowrap">Source</TableHead>
              <TableHead className="whitespace-nowrap">Department</TableHead>
              <TableHead className="whitespace-nowrap">Agent</TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => headClick("updated_date")}>
                Updated{sortIcon("updated_date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
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
                  <TableCell className="font-mono text-xs">{order.id?.slice(-6)?.toUpperCase()}</TableCell>
                  <TableCell className="font-medium">{order.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.contact_number}</TableCell>
                  <TableCell>{order.order_product}</TableCell>
                  <TableCell className="text-right">{order.order_quantity}</TableCell>
                  <TableCell className="text-right font-medium">₱{(order.amount || 0).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={order.order_status} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.order_source}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.team_department}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.agent_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {order.updated_date ? moment(order.updated_date).fromNow() : "-"}
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