import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/PageHeader";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.User.list("-created_date", 100).catch(() => []),
    ]).then(([me, u]) => {
      setUser(me);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title="Settings" description="Manage your account and team" />

      {/* Profile */}
      <div className="bg-card rounded-xl border p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4">Your Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</Label>
            <Input value={user?.full_name || ""} disabled className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</Label>
            <Input value={user?.email || ""} disabled className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</Label>
            <Badge variant={user?.role === "admin" ? "default" : "secondary"}>{user?.role}</Badge>
          </div>
        </div>
      </div>

      {/* Team Members */}
      {isAdmin && (
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-4">Team Members</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}