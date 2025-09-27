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
import { ArrowLeft, Users, Building, UserCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
  created_by: string;
  managed_by?: string;
}

interface TenantProperty {
  id: string;
  property_id: string;
  tenant_id: string;
  status: string;
  properties: {
    name: string;
    address: string;
  };
}

interface UserWithAssignments {
  user: User;
  properties?: Property[];
  tenantProperties?: TenantProperty[];
}

interface PropertyWithAssignments {
  property: Property;
  propertyManager?: User;
  tenants: User[];
}

export default function AdminUserOverview() {
  const [userGroups, setUserGroups] = useState<{
    admins: User[];
    propertyManagers: UserWithAssignments[];
    tenants: UserWithAssignments[];
  }>({
    admins: [],
    propertyManagers: [],
    tenants: [],
  });
  const [properties, setProperties] = useState<PropertyWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    fetchUserOverview();
  }, []);

  const fetchUserOverview = async () => {
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("role", { ascending: false })
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch all properties with created_by
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      if (propertiesError) throw propertiesError;

      // Fetch all tenant properties
      const { data: tenantProperties, error: tpError } = await supabase
        .from("tenant_properties")
        .select(`
          *,
          properties (name, address)
        `)
        .order("created_at", { ascending: false });

      if (tpError) throw tpError;

      // Group users and their assignments
      const admins: User[] = [];
      const propertyManagers: UserWithAssignments[] = [];
      const tenants: UserWithAssignments[] = [];

      users?.forEach((user) => {
        if (user.role === "admin") {
          admins.push(user);
        } else if (user.role === "property_manager") {
          const assignedProperties = properties?.filter(p => p.managed_by === user.id) || [];
          propertyManagers.push({
            user,
            properties: assignedProperties,
          });
        } else if (user.role === "tenant") {
          const assignedProperties = tenantProperties?.filter(tp => tp.tenant_id === user.id && tp.status === "active") || [];
          tenants.push({
            user,
            tenantProperties: assignedProperties,
          });
        }
      });

      // Group properties with their assignments
      const propertiesWithAssignments: PropertyWithAssignments[] = properties?.map(property => {
        const propertyManager = users?.find(u => u.id === property.managed_by && u.role === "property_manager");
        const propertyTenants = tenantProperties
          ?.filter(tp => tp.property_id === property.id && tp.status === "active")
          .map(tp => users?.find(u => u.id === tp.tenant_id))
          .filter(Boolean) as User[];

        return {
          property,
          propertyManager,
          tenants: propertyTenants || [],
        };
      }) || [];

      setUserGroups({
        admins,
        propertyManagers,
        tenants,
      });
      setProperties(propertiesWithAssignments);
    } catch (error) {
      console.error("Error fetching user overview:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load user overview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "property_manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "tenant":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
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
            {t("common.backToDashboard")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Overview & Assignments
            </h1>
            <p className="text-muted-foreground mt-2">
              Overview of all users and their property assignments
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users & Assignments</TabsTrigger>
            <TabsTrigger value="properties">Properties & Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-8">
            {/* Admins Section */}
            <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Administrators ({userGroups.admins.length})
            </CardTitle>
            <CardDescription>
              System administrators with full access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userGroups.admins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userGroups.admins.map((admin) => (
                  <Card key={admin.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {admin.full_name || admin.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(admin.role)}>
                          {admin.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No administrators found.</p>
            )}
          </CardContent>
        </Card>

        {/* Property Managers Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property Managers ({userGroups.propertyManagers.length})
            </CardTitle>
            <CardDescription>
              Property managers and their assigned properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userGroups.propertyManagers.length > 0 ? (
              <div className="space-y-6">
                {userGroups.propertyManagers.map((pm) => (
                  <Card key={pm.user.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">
                            {pm.user.full_name || pm.user.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{pm.user.email}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(pm.user.role)}>
                          {pm.user.role}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <h5 className="text-sm font-medium mb-2">Assigned Properties ({pm.properties?.length || 0}):</h5>
                        {pm.properties && pm.properties.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pm.properties.map((property) => (
                              <div key={property.id} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                                <p className="font-medium text-sm">{property.name}</p>
                                <p className="text-xs text-muted-foreground">{property.address}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {property.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No properties assigned</p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(pm.user.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No property managers found.</p>
            )}
          </CardContent>
        </Card>

        {/* Tenants Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenants ({userGroups.tenants.length})
            </CardTitle>
            <CardDescription>
              Tenants and their assigned properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userGroups.tenants.length > 0 ? (
              <div className="space-y-6">
                {userGroups.tenants.map((tenant) => (
                  <Card key={tenant.user.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">
                            {tenant.user.full_name || tenant.user.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{tenant.user.email}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(tenant.user.role)}>
                          {tenant.user.role}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <h5 className="text-sm font-medium mb-2">Assigned Properties ({tenant.tenantProperties?.length || 0}):</h5>
                        {tenant.tenantProperties && tenant.tenantProperties.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tenant.tenantProperties.map((tp) => (
                              <div key={tp.id} className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
                                <p className="font-medium text-sm">{tp.properties.name}</p>
                                <p className="text-xs text-muted-foreground">{tp.properties.address}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {tp.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No properties assigned</p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(tenant.user.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tenants found.</p>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {/* Properties Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((propAssignment) => (
                <Card key={propAssignment.property.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{propAssignment.property.name}</CardTitle>
                        <CardDescription>{propAssignment.property.address}</CardDescription>
                      </div>
                      <Badge className={propAssignment.property.status === "available" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-800"}>
                        {propAssignment.property.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Property Manager */}
                    {propAssignment.propertyManager ? (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Property Manager</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {propAssignment.propertyManager.full_name || propAssignment.propertyManager.name}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{propAssignment.propertyManager.email}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">No property manager assigned</p>
                      </div>
                    )}

                    {/* Tenants */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Tenants ({propAssignment.tenants.length}):</h5>
                      {propAssignment.tenants.length > 0 ? (
                        <div className="space-y-2">
                          {propAssignment.tenants.map((tenant) => (
                            <div key={tenant.id} className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                {tenant.full_name || tenant.name}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">{tenant.email}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tenants assigned</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {properties.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Properties Found
                  </h3>
                  <p className="text-muted-foreground">
                    There are no properties in the system yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}