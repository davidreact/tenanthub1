"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserX, Package } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

import { useToast } from "@/components/ui/use-toast";
import { useCSRF } from "@/hooks/useCSRF";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface TenantProperty {
  id: string;
  tenant_id: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  status: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    name: string;
    is_active: boolean;
  };
}

export default function PropertyTenants() {
  const [property, setProperty] = useState<Property | null>(null);
  const [tenantProperties, setTenantProperties] = useState<TenantProperty[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClient();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { csrfToken, loading: csrfLoading, error: csrfError } = useCSRF();

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  const fetchData = async () => {
    try {
      // Fetch property details
      const { data: propertyData } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      // Fetch tenant properties first
      const { data: tenantPropsData, error: tenantError } = await supabase
        .from("tenant_properties")
        .select(
          `
          *,
          users (id, email, full_name, name, is_active)
        `,
        )
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (tenantError) {
        console.error("Error fetching tenant properties:", tenantError);
        return;
      }

      // Fetch assignment summaries for each tenant property
      const tenantIds = tenantPropsData?.map(tp => tp.id) || [];
      let assignmentSummaries: { [key: string]: { count: number; totalValue: number } } = {};

      console.log("Tenant IDs for assignment query:", tenantIds);

      if (tenantIds.length > 0) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("inventory_assignments")
          .select(
            `
            tenant_property_id,
            inventory_items!inventory_assignments_inventory_item_id_fkey (
              estimated_value
            )
          `,
          )
          .in("tenant_property_id", tenantIds)
          .is("returned_date", null); // Only active assignments

        console.log("Assignment query result:", { assignmentsData, assignmentsError });

        if (!assignmentsError && assignmentsData) {
          // Group assignments by tenant_property_id
          const grouped = assignmentsData.reduce((acc: any, assignment: any) => {
            const tenantId = assignment.tenant_property_id;
            console.log("Processing assignment:", { tenantId, assignment });
            if (!acc[tenantId]) {
              acc[tenantId] = { count: 0, totalValue: 0 };
            }
            acc[tenantId].count += 1;
            acc[tenantId].totalValue += assignment.inventory_items?.estimated_value || 0;
            return acc;
          }, {});

          assignmentSummaries = grouped;
          console.log("Final assignment summaries:", assignmentSummaries);
        }
      }

      // Process tenant data to include assignment summaries
      const processedTenants = (tenantPropsData || []).map((tenantProperty: any) => {
        const summary = assignmentSummaries[tenantProperty.id] || { count: 0, totalValue: 0 };
        return {
          ...tenantProperty,
          assigned_items_count: summary.count,
          assigned_total_value: summary.totalValue,
        };
      });


      setProperty(propertyData);
      setTenantProperties(processedTenants);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantPropertyStatus = async (
    tenantPropertyId: string,
    newStatus: string,
  ) => {
    if (!csrfToken) {
      toast({
        title: t("common.error"),
        description: "Security token missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/update-tenant-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantPropertyId,
          status: newStatus,
          csrfToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update tenant property status");
      }

      fetchData(); // Refresh data

      toast({
        title: t("common.success"),
        description: `Tenant property status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating tenant property status:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to update tenant property status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("tenants.loadingTenants")}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("common.propertyNotFound")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("common.propertyNotFoundDescription")}
          </p>
          <Link href="/admin/properties">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.backToProperties")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              {formatTranslation("tenants.tenantsFor", language, {
                propertyName: property.name,
              })}
            </h1>
            <p className="text-muted-foreground mt-2">{property.address}</p>
          </div>
        </div>

        {/* Tenants List */}
        <div className="space-y-6">
          {tenantProperties.map((tenantProperty) => (
            <Card
              key={tenantProperty.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {tenantProperty.users.full_name ||
                        tenantProperty.users.name ||
                        "Unnamed Tenant"}
                    </CardTitle>
                    <CardDescription>
                      {tenantProperty.users.email}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        tenantProperty.users.is_active ? "default" : "secondary"
                      }
                    >
                      {tenantProperty.users.is_active
                        ? t("tenants.activeUser")
                        : t("tenants.inactiveUser")}
                    </Badge>
                    <Badge
                      variant={
                        tenantProperty.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {tenantProperty.status === "active"
                        ? t("tenants.activeLease")
                        : t("tenants.terminatedLease")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {t("common.monthlyRent")}:
                    </span>
                    <p className="font-medium">
                      ${tenantProperty.monthly_rent}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("common.leaseStart")}:
                    </span>
                    <p className="font-medium">
                      {new Date(
                        tenantProperty.lease_start_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("common.leaseEnd")}:
                    </span>
                    <p className="font-medium">
                      {new Date(
                        tenantProperty.lease_end_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded border">
                  <h4 className="font-medium text-base mb-2 text-foreground">Assigned Inventory</h4>
                  <p className="text-sm text-muted-foreground">
                    {(tenantProperty as any).assigned_items_count || 0} items | {formatCurrency((tenantProperty as any).assigned_total_value || 0)}
                  </p>
                  <Link href={`/admin/properties/${propertyId}/inventory`}>
                    <Button variant="outline" size="default" className="mt-3">
                      View & Manage Assignments
                    </Button>
                  </Link>
                </div>

                {tenantProperty.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateTenantPropertyStatus(
                        tenantProperty.id,
                        "terminated",
                      )
                    }
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {t("tenants.terminateLease")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {tenantProperties.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("tenants.noTenantsAssignedTitle")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("tenants.noTenantsAssignedDescription")}
              </p>
              <Link href="/admin/tenants">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  {t("tenants.manageTenants")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}
