"use client";

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
  Home,
  Package,
  CreditCard,
  MessageSquare,
  Calendar,
  Users,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
  tenantProperty: any;
  adminStats: any;
}

export default function DashboardContent({
  isAdmin,
  userProfile,
  tenantProperty,
  adminStats,
}: DashboardContentProps) {
  const { t } = useLanguage();

  return (
    <main className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin
              ? t("dashboard.adminDashboard")
              : t("dashboard.tenantDashboard")}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? t("dashboard.manageProperties")
              : `${t("dashboard.welcomeBack")}, ${userProfile?.full_name || userProfile?.name || "Tenant"}`}
          </p>
        </div>

        {isAdmin ? (
          // Admin Dashboard
          <div className="space-y-8">
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("properties.totalProperties")}
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats?.properties}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("tenants.activeTenants")}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats?.tenants}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("payments.pendingPayments")}
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats?.pendingPayments}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {t("properties.manageProperties")}
                  </CardTitle>
                  <CardDescription>
                    {t("properties.addEditManage")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/properties">
                    <Button className="w-full">
                      {t("properties.viewProperties")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t("tenants.manageTenants")}
                  </CardTitle>
                  <CardDescription>
                    {t("tenants.addEditManage")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/tenants">
                    <Button className="w-full">
                      {t("tenants.viewTenants")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("payments.paymentManagement")}
                  </CardTitle>
                  <CardDescription>
                    {t("payments.reviewApprove")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/payments">
                    <Button className="w-full">
                      {t("payments.viewPayments")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {t("messages.conversations")}
                  </CardTitle>
                  <CardDescription>
                    {t("messages.manageTenantCommunications")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/conversations">
                    <Button className="w-full">
                      {t("messages.viewMessages")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t("inventory.inventoryManagement")}
                  </CardTitle>
                  <CardDescription>
                    {t("inventory.managePropertyInventories")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/inventory">
                    <Button className="w-full">
                      {t("inventory.viewInventory")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t("handover.keyHandovers")}
                  </CardTitle>
                  <CardDescription>
                    {t("handover.scheduleManage")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/handovers">
                    <Button className="w-full">
                      {t("handover.viewSchedule")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Tenant Dashboard
          <div className="space-y-8">
            {tenantProperty ? (
              <>
                {/* Property Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {t("property.yourProperty")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {tenantProperty.properties.name}
                        </h3>
                        <p className="text-gray-600">
                          {tenantProperty.properties.address}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            {t("property.monthlyRent")}
                          </span>
                          <p className="font-semibold">
                            ${tenantProperty.monthly_rent}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("property.leaseStart")}
                          </span>
                          <p className="font-semibold">
                            {new Date(
                              tenantProperty.lease_start_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("property.leaseEnd")}
                          </span>
                          <p className="font-semibold">
                            {new Date(
                              tenantProperty.lease_end_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("property.status")}
                          </span>
                          <Badge
                            variant={
                              tenantProperty.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {tenantProperty.status === "active"
                              ? t("common.active")
                              : t("common.inactive")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {t("inventory.inventory")}
                      </CardTitle>
                      <CardDescription>
                        {t("inventory.viewManageProperty")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tenant/inventory">
                        <Button className="w-full">
                          {t("inventory.viewInventory")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t("payments.paymentManagement")}
                      </CardTitle>
                      <CardDescription>
                        {t("payments.uploadProofView")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tenant/payments">
                        <Button className="w-full">
                          {t("payments.managePayments")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        {t("messages.messages")}
                      </CardTitle>
                      <CardDescription>
                        {t("messages.contactAdminProperty")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tenant/messages">
                        <Button className="w-full">
                          {t("messages.sendMessage")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t("handover.keyHandover")}
                      </CardTitle>
                      <CardDescription>
                        {t("handover.scheduleKeyExchanges")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tenant/handover">
                        <Button className="w-full">
                          {t("handover.schedule")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{t("property.noPropertyAssigned")}</CardTitle>
                  <CardDescription>
                    {t("property.contactAdministrator")}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
