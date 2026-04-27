import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "../components/PageHeader";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteMode, setInviteMode] = useState("password"); // 'password' | 'magic'
  const [inviting, setInviting] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("agent");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = () =>
    base44.entities.User.list("-created_date", 100)
      .then(setUsers)
      .catch(() => setUsers([]));

  useEffect(() => {
    Promise.all([base44.auth.me(), loadUsers()]).then(([me]) => {
      setUser(me);
      setLoading(false);
    });
  }, []);

  const isAdmin = user?.role === "admin";

  // Invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return toast.error("Please enter an email");
    if (inviteMode === "password") {
      if (!invitePassword || invitePassword.length < 6) {
        return toast.error("Password must be at least 6 characters");
      }
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(
        inviteEmail.trim(),
        inviteRole,
        inviteMode === "password" ? invitePassword : null
      );
      toast.success(
        inviteMode === "password"
          ? `Account created for ${inviteEmail}`
          : `Invitation sent to ${inviteEmail}`
      );
      setInviteEmail("");
      setInviteRole("agent");
      setInvitePassword("");
      setInviteMode("password");
      setInviteOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error(err.message || "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  // Edit role
  const openEdit = (u) => {
    setEditingUser(u);
    setEditRole(u.role || "agent");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    await base44.entities.User.update(editingUser.id, { role: editRole });
    toast.success("Role updated");
    setEditOpen(false);
    setSaving(false);
    await loadUsers();
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.User.delete(deleteTarget.id);
    toast.success("User removed");
    setDeleteTarget(null);
    setDeleting(false);
    await loadUsers();
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
            <div className="mt-1">
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>{user?.role}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members (admin only) */}
      {isAdmin && (
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Team Members ({users.length})</h3>
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Invite User
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No team members yet</TableCell>
                  </TableRow>
                ) : (
                  users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role || "agent"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(u)}
                            disabled={u.id === user?.id}
                            title="Edit role"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(u)}
                            disabled={u.id === user?.id}
                            title="Remove user"
                          >
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
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Invite Method</Label>
              <Select value={inviteMode} onValueChange={setInviteMode}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">Set initial password (no email)</SelectItem>
                  <SelectItem value="magic">Email magic link invite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteMode === "password" && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Initial Password</Label>
                <Input
                  type="text"
                  placeholder="At least 6 characters"
                  value={invitePassword}
                  onChange={e => setInvitePassword(e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">Share this with the user. They can change it later.</p>
              </div>
            )}
            <Button onClick={handleInvite} disabled={inviting} className="w-full">
              {inviting
                ? (inviteMode === "password" ? "Creating..." : "Sending...")
                : (inviteMode === "password" ? "Create Account" : "Send Invitation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role — {editingUser?.full_name || editingUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong> from the team? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}