"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, UserCheck, UserX, Users, Settings, Building } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  status: string;
  is_active: boolean;
  created_at: string;
  approved_at: string | null;
}

type UserRole = 'admin' | 'property_manager' | 'tenant';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
    fetchPropertiesAndManagers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertiesAndManagers = async () => {
    try {
      // Fetch unassigned properties with tenant information
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          id,
          name,
          address,
          managed_by,
          tenant_properties (
            tenant_id,
            users!tenant_properties_tenant_id_fkey (
              full_name,
              name,
              email
            )
          )
        `)
        .is("managed_by", null)
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };


  const updateUserStatus = async (userId: string, status: string, role?: UserRole) => {
    try {
      const updateData: any = { status };
      if (status === 'approved') {
        updateData.approved_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      // Update status first
      const { error: statusError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (statusError) throw statusError;

      // If role is provided, update it directly
      if (role) {
        const { error: roleError } = await supabase
          .from("users")
          .update({ role })
          .eq("id", userId);
        if (roleError) throw roleError;
      }

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: status === 'approved' ? 'user_approved' : 'user_rejected',
        target_type: 'user',
        target_id: userId,
        details: { role, status }
      });

      toast({
        title: t("common.success"),
        description: `User ${status === 'approved' ? 'approved' : 'rejected'}${role ? ` as ${role}` : ''}`,
      });

      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: isActive ? 'user_enabled' : 'user_disabled',
        target_type: 'user',
        target_id: userId
      });

      toast({
        title: t("common.success"),
        description: `User ${isActive ? 'enabled' : 'disabled'}`,
      });

      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole, csrfToken })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change role');
      }

      toast({
        title: t("common.success"),
        description: result.message || `User role changed to ${newRole}`,
      });

      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error changing user role:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to change user role",
        variant: "destructive",
      });
    }
  };

  const assignPropertyToManager = async (propertyId: string, propertyManagerId: string) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/admin/assign-property-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, propertyManagerId, csrfToken })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign property');
      }

      toast({
        title: t("common.success"),
        description: result.message || "Property assigned to property manager",
      });

      fetchPropertiesAndManagers(); // Refresh properties list
    } catch (error) {
      console.error("Error assigning property:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to assign property",
        variant: "destructive",
      });
    }
  };


  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "property_manager": return "bg-blue-100 text-blue-800";
      case "tenant": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Approve users, assign roles, and manage access
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.filter(u => u.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.filter(u => u.status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">Approved Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.filter(u => !u.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">Disabled Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user approvals, roles, and access status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.full_name || user.name || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status, user.is_active)}>
                        {!user.is_active ? 'Disabled' : user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.status === 'pending' && (
                          <div className="flex gap-2">
                            <Select
                              onValueChange={(role: UserRole) =>
                                updateUserStatus(user.id, 'approved', role)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Approve as..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tenant">Tenant</SelectItem>
                                <SelectItem value="property_manager">Property Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserStatus(user.id, 'rejected')}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {user.status === 'approved' && (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={user.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleUserActive(user.id, !user.is_active)}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>

                            {/* Role Change Button - only for property_manager and tenant roles */}
                            {(user.role === 'property_manager' || user.role === 'tenant') && (
                              <Dialog open={roleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                                setRoleDialogOpen(open);
                                if (open) setSelectedUser(user);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Change Role
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change User Role</DialogTitle>
                                    <DialogDescription>
                                      Change {user.full_name}'s role. They will need to sign in again for changes to take effect.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      onClick={() => {
                                        changeUserRole(user.id, user.role === 'property_manager' ? 'tenant' : 'property_manager');
                                        setRoleDialogOpen(false);
                                      }}
                                      className="flex-1"
                                    >
                                      Change to {user.role === 'property_manager' ? 'Tenant' : 'Property Manager'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* Property Assignment Button - only for property_managers */}
                            {user.role === 'property_manager' && properties.length > 0 && (
                              <Dialog open={propertyDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                                setPropertyDialogOpen(open);
                                if (open) setSelectedUser(user);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Building className="h-4 w-4 mr-1" />
                                    Assign Property
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Property to Property Manager</DialogTitle>
                                    <DialogDescription>
                                      Assign an unassigned property to {user.full_name}.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    {properties.map((property) => (
                                      <Card key={property.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{property.name}</h4>
                                            <p className="text-muted-foreground mb-2">📍 {property.address}</p>

                                            {/* Show tenants if any */}
                                            {property.tenant_properties && property.tenant_properties.length > 0 ? (
                                              <div className="mt-3">
                                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                                  Current Tenants ({property.tenant_properties.length}):
                                                </p>
                                                <div className="space-y-1">
                                                  {property.tenant_properties.map((tp: any) => (
                                                    <div key={tp.tenant_id} className="flex items-center gap-2 text-sm">
                                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                      <span>{tp.users?.full_name || tp.users?.name || 'Unnamed Tenant'}</span>
                                                      <span className="text-muted-foreground">({tp.users?.email})</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-sm text-muted-foreground mt-2">No tenants assigned</p>
                                            )}
                                          </div>

                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              assignPropertyToManager(property.id, user.id);
                                              setPropertyDialogOpen(false);
                                            }}
                                            className="ml-4"
                                          >
                                            Assign Property
                                          </Button>
                                        </div>
                                      </Card>
                                    ))}
                                    {properties.length === 0 && (
                                      <p className="text-center text-muted-foreground py-4">
                                        No unassigned properties available
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex justify-end mt-4">
                                    <Button variant="outline" onClick={() => setPropertyDialogOpen(false)}>
                                      Close
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}