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
import { ArrowLeft, Users, UserX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTranslation } from "@/lib/i18n";

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

      // Fetch tenant assignments for this property
      const { data: tenantPropsData } = await supabase
        .from("tenant_properties")
        .select(
          `
          *,
          users (id, email, full_name, name, is_active)
        `,
        )
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      setProperty(propertyData);
      setTenantProperties(tenantPropsData || []);
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
    try {
      await supabase
        .from("tenant_properties")
        .update({ status: newStatus })
        .eq("id", tenantPropertyId);

      // If terminating lease, update property status to available
      if (newStatus === "terminated") {
        await supabase
          .from("properties")
          .update({ status: "available" })
          .eq("id", propertyId);
      }

      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error updating tenant property status:", error);
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
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/properties"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToProperties")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8" />
              {formatTranslation("tenants.tenantsFor", language, {
                propertyName: property.name,
              })}
            </h1>
            <p className="text-gray-600 mt-2">{property.address}</p>
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
                    <span className="text-gray-500">
                      {t("common.monthlyRent")}:
                    </span>
                    <p className="font-medium">
                      ${tenantProperty.monthly_rent}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("common.leaseStart")}:
                    </span>
                    <p className="font-medium">
                      {new Date(
                        tenantProperty.lease_start_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("common.leaseEnd")}:
                    </span>
                    <p className="font-medium">
                      {new Date(
                        tenantProperty.lease_end_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {tenantProperty.status === "active" && (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {tenantProperties.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("tenants.noTenantsAssignedTitle")}
              </h3>
              <p className="text-gray-600 mb-4">
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
