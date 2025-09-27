"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  Users,
  Plus,
  Edit,
  UserX,
  UserCheck,
  Building,
} from "lucide-react";
import Link from "next/link";
import { createTenantAction } from "../../actions";
import { FormMessage } from "@/components/form-message";
import { useToast } from "@/components/ui/use-toast";
import { useCSRF } from "@/hooks/useCSRF";

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TenantProperty {
  id: string;
  tenant_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  status: string;
  properties: {
    name: string;
    address: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<User[]>([]);
  const [tenantProperties, setTenantProperties] = useState<TenantProperty[]>(
    [],
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();
  const { csrfToken, loading: csrfLoading, error: csrfError } = useCSRF();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const scope = pathname.startsWith('/pm-dashboard') ? 'pm' : 'admin';

  useEffect(() => {
    fetchData();
  }, [scope]);

  const fetchData = async () => {
    try {
      let propertyIds: string[] = [];

      if (scope === 'pm') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: pmProperties } = await supabase
            .from("properties")
            .select("id")
            .eq("managed_by", user.id);
          propertyIds = pmProperties?.map(p => p.id) || [];
        }
      }

      // Fetch tenant properties
      let tenantPropsQuery = supabase
        .from("tenant_properties")
        .select(
          `
          *,
          properties (name, address)
        `,
        )
        .order("created_at", { ascending: false });

      if (scope === 'pm' && propertyIds.length > 0) {
        tenantPropsQuery = tenantPropsQuery.in("property_id", propertyIds);
      }

      const { data: tenantPropsData } = await tenantPropsQuery;

      // Get tenant ids from tenant properties
      const tenantIds = tenantPropsData?.map(tp => tp.tenant_id) || [];

      // Fetch tenants
      let tenantsQuery = supabase
        .from("users")
        .select("*")
        .eq("role", "tenant")
        .order("created_at", { ascending: false });

      if (scope === 'pm' && tenantIds.length > 0) {
        tenantsQuery = tenantsQuery.in("id", tenantIds);
      }

      const { data: tenantsData } = await tenantsQuery;

      // Fetch available properties
      let propertiesQuery = supabase
        .from("properties")
        .select("id, name, address, status")
        .order("name");

      if (scope === 'pm' && propertyIds.length > 0) {
        propertiesQuery = propertiesQuery.in("id", propertyIds);
      }

      const { data: propertiesData } = await propertiesQuery;

      setTenants(tenantsData || []);
      setTenantProperties(tenantPropsData || []);
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (formData: FormData) => {
    const result = await createTenantAction(formData);
    if (result) {
      setIsCreateDialogOpen(false);
      fetchData(); // Refresh the tenant list
      // The redirect will handle showing success/error messages
    }
  };

  const toggleTenantStatus = async (tenantId: string, isActive: boolean) => {
    try {
      await supabase
        .from("users")
        .update({ is_active: !isActive })
        .eq("id", tenantId);

      fetchData(); // Refresh the list

      toast({
        title: t("common.success"),
        description: `${t("common.tenant")} has been ${!isActive ? t("common.active") : t("common.inactive")} successfully.`,
      });
    } catch (error) {
      console.error("Error updating tenant status:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update tenant status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const assignProperty = async (
    tenantId: string,
    propertyId: string,
    leaseStart: string,
    leaseEnd: string,
    monthlyRent: number,
    csrfToken: string,
  ) => {
    try {
      const response = await fetch("/api/admin/assign-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          propertyId,
          leaseStart,
          leaseEnd,
          monthlyRent,
          csrfToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign property");
      }

      fetchData(); // Refresh the list
      setIsAssignDialogOpen(false);

      toast({
        title: t("common.success"),
        description: `${t("common.property")} has been assigned to ${t("common.tenant")} successfully.`,
      });
    } catch (error) {
      console.error("Error assigning property:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to assign property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTenantProperty = (tenantId: string) => {
    return tenantProperties.find(
      (tp) => tp.tenant_id === tenantId && tp.status === "active",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  
  function AdminTenantsContent() {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
        <AdminTenantsContent />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={pathname.startsWith('/pm-dashboard') ? "/pm-dashboard" : "/admin"}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>

          {/* Show form messages */}
          {searchParams.get("message") && (
            <FormMessage message={{ message: searchParams.get("message")! }} />
          )}
          {searchParams.get("error") && (
            <FormMessage message={{ error: searchParams.get("error")! }} />
          )}
          {searchParams.get("success") && (
            <FormMessage message={{ success: searchParams.get("success")! }} />
          )}

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-8 w-8" />
                {t("tenants.manageTenants")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("tenants.addEditManage")}
              </p>
            </div>
            {scope === 'admin' && (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("common.add")} {t("common.tenant")}
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("common.add")} {t("common.tenant")}
                  </DialogTitle>
                  <DialogDescription>
                    Create a new tenant account. They will receive an email
                    confirmation.
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreateTenant} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t("common.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="tenant@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">{t("common.fullName")}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {t("common.temporaryPassword")}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      minLength={6}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      The tenant will be able to change this password after
                      their first login.
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    {t("common.save")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => {
            const tenantProperty = getTenantProperty(tenant.id);
            return (
              <Card
                key={tenant.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {tenant.full_name || tenant.name || t("common.tenant")}
                      </CardTitle>
                      <CardDescription>{tenant.email}</CardDescription>
                    </div>
                    <Badge variant={tenant.is_active ? "default" : "secondary"}>
                      {tenant.is_active
                        ? t("common.active")
                        : t("common.inactive")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Property Assignment */}
                  {tenantProperty ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {t("common.property")}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">
                        {tenantProperty.properties.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        ${tenantProperty.monthly_rent}/month
                      </p>
                      <p className="text-xs text-blue-600">
                        {new Date(
                          tenantProperty.lease_start_date,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          tenantProperty.lease_end_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        No {t("common.property")} assigned
                      </p>
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="text-sm text-gray-600">
                    <p>
                      {t("common.created")}:{" "}
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleTenantStatus(tenant.id, tenant.is_active)
                      }
                      className="flex-1"
                    >
                      {tenant.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          {t("common.inactive")}
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          {t("common.active")}
                        </>
                      )}
                    </Button>

                    {!tenantProperty && (
                      <Dialog
                        open={isAssignDialogOpen}
                        onOpenChange={setIsAssignDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <Building className="h-4 w-4 mr-2" />
                            Assign {t("common.property")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Assign {t("common.property")}
                            </DialogTitle>
                            <DialogDescription>
                              Assign a {t("common.property")} to{" "}
                              {tenant.full_name || tenant.name}
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!csrfToken) {
                                toast({
                                  title: t("common.error"),
                                  description: "Security token missing. Please refresh and try again.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              const formData = new FormData(e.currentTarget);
                              const propertyId = formData.get(
                                "propertyId",
                              ) as string;
                              const leaseStart = formData.get(
                                "leaseStart",
                              ) as string;
                              const leaseEnd = formData.get(
                                "leaseEnd",
                              ) as string;
                              const monthlyRent = parseFloat(
                                formData.get("monthlyRent") as string,
                              );

                              if (selectedTenant) {
                                assignProperty(
                                  selectedTenant.id,
                                  propertyId,
                                  leaseStart,
                                  leaseEnd,
                                  monthlyRent,
                                  csrfToken,
                                );
                              }
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="propertyId">
                                {t("common.property")}
                              </Label>
                              <Select name="propertyId" required>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select a ${t("common.property")}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {properties
                                    .filter((p) => p.status === "available")
                                    .map((property) => (
                                      <SelectItem
                                        key={property.id}
                                        value={property.id}
                                      >
                                        {property.name} - {property.address}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              {properties.filter(
                                (p) => p.status === "available",
                              ).length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  No available {t("common.property")} found.
                                  Please add
                                  {t("common.property")} or change their status
                                  to "available".
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="leaseStart">
                                  {t("common.leaseStart")}
                                </Label>
                                <Input
                                  id="leaseStart"
                                  name="leaseStart"
                                  type="date"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="leaseEnd">
                                  {t("common.leaseEnd")}
                                </Label>
                                <Input
                                  id="leaseEnd"
                                  name="leaseEnd"
                                  type="date"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="monthlyRent">
                                {t("common.monthlyRent")} ($)
                              </Label>
                              <Input
                                id="monthlyRent"
                                name="monthlyRent"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full">
                              Assign {t("common.property")}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {tenants.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No {t("tenants.activeTenants")}
              </h3>
              <p className="text-muted-foreground">
                {t("tenants.addEditManage")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("tenants.activeTenants")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("common.active")} {t("tenants.activeTenants")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("common.property")} Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantProperties.filter((tp) => tp.status === "active").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
