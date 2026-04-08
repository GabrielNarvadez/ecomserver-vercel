import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/PageHeader";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Customer.list("-created_date", 500),
      base44.entities.Order.list("-created_date", 500),
    ]).then(([c, o]) => {
      setCustomers(c);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const customerData = useMemo(() => {
    return customers.map(c => {
      const custOrders = orders.filter(o => o.customer_id === c.id || o.customer_name === c.name);
      return {
        ...c,
        orderCount: custOrders.length,
        totalPurchase: custOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      };
    });
  }, [customers, orders]);

  const filtered = useMemo(() => {
    if (!search) return customerData;
    const q = search.toLowerCase();
    return customerData.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.contact_number?.includes(q)
    );
  }, [customerData, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Customers" description={`${filtered.length} customers`}>
        <Link to="/customers/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        </Link>
      </PageHeader>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9 h-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Purchase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">No customers found</TableCell>
                </TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-accent/40" onClick={() => {}}>
                    <TableCell>
                      <Link to={`/customers/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.contact_number}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{c.complete_address}</TableCell>
                    <TableCell>
                      {c.facebook_link && (
                        <a href={c.facebook_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          View Profile
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{c.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">₱{c.totalPurchase.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}