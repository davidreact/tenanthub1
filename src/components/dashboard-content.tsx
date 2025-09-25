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
import Breadcrumb from "@/components/breadcrumb";

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
    <main className="w-full bg-hero-gradient min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin
              ? t("dashboard.adminDashboard")
              : t("dashboard.tenantDashboard")}
          </h1>
          <p className="text-muted-foreground mt-2">
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
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("properties.totalProperties")}
                  </CardTitle>
                  <Building className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {adminStats?.properties}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total managed properties
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-blue-500/5 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("tenants.activeTenants")}
                  </CardTitle>
                  <Users className="h-5 w-5 text-blue-600 group-hover:text-blue-500 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {adminStats?.tenants}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active tenant accounts
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-orange-500/5 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("payments.pendingPayments")}
                  </CardTitle>
                  <CreditCard className="h-5 w-5 text-orange-600 group-hover:text-orange-500 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {adminStats?.pendingPayments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/admin/properties" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-emerald-500/10 border-0 shadow-md hover:shadow-emerald-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                        <Building className="h-5 w-5 text-emerald-600" />
                      </div>
                      {t("properties.manageProperties")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("properties.addEditManage")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-emerald-600 transition-colors">
                      {t("properties.viewProperties")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/tenants" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-blue-500/10 border-0 shadow-md hover:shadow-blue-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      {t("tenants.manageTenants")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("tenants.addEditManage")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-blue-600 transition-colors">
                      {t("tenants.viewTenants")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/payments" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-orange-500/10 border-0 shadow-md hover:shadow-orange-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                      </div>
                      {t("payments.paymentManagement")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("payments.reviewApprove")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-orange-600 transition-colors">
                      {t("payments.viewPayments")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/conversations" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-purple-500/10 border-0 shadow-md hover:shadow-purple-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      {t("messages.conversations")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("messages.manageTenantCommunications")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-purple-600 transition-colors">
                      {t("messages.viewMessages")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/inventory" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-indigo-500/10 border-0 shadow-md hover:shadow-indigo-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      {t("inventory.inventoryManagement")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("inventory.managePropertyInventories")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-indigo-600 transition-colors">
                      {t("inventory.viewInventory")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/handovers" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-rose-500/10 border-0 shadow-md hover:shadow-rose-100/50 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                        <Calendar className="h-5 w-5 text-rose-600" />
                      </div>
                      {t("handover.keyHandovers")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("handover.scheduleManage")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-rose-600 transition-colors">
                      {t("handover.viewSchedule")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        ) : (
          // Tenant Dashboard
          <div className="space-y-8">
            {tenantProperty ? (
              <>
                {/* Property Info */}
                <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      {t("property.yourProperty")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg">
                        <h3 className="font-bold text-xl text-foreground">
                          {tenantProperty.properties.name}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          {tenantProperty.properties.address}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                          <span className="text-emerald-700 text-sm font-medium">
                            {t("property.monthlyRent")}
                          </span>
                          <p className="font-bold text-lg text-emerald-800">
                            ${tenantProperty.monthly_rent}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                          <span className="text-blue-700 text-sm font-medium">
                            {t("property.leaseStart")}
                          </span>
                          <p className="font-bold text-sm text-blue-800">
                            {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(
                              new Date(tenantProperty.lease_start_date)
                            )}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">
                          <span className="text-orange-700 text-sm font-medium">
                            {t("property.leaseEnd")}
                          </span>
                          <p className="font-bold text-sm text-orange-800">
                            {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(
                              new Date(tenantProperty.lease_end_date)
                            )}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                          <span className="text-purple-700 text-sm font-medium">
                            {t("property.status")}
                          </span>
                          <div className="mt-1">
                            <Badge
                              variant={
                                tenantProperty.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                tenantProperty.status === "active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : ""
                              }
                            >
                              {tenantProperty.status === "active"
                                ? t("common.active")
                                : t("common.inactive")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Link href="/tenant/inventory" className="group">
                    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-indigo-500/10 border-0 shadow-md hover:shadow-indigo-100/50 h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                            <Package className="h-5 w-5 text-indigo-600" />
                          </div>
                          {t("inventory.inventory")}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {t("inventory.viewManageProperty")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full group-hover:bg-indigo-600 transition-colors">
                          {t("inventory.viewInventory")}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/tenant/payments" className="group">
                    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-emerald-500/10 border-0 shadow-md hover:shadow-emerald-100/50 h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                            <CreditCard className="h-5 w-5 text-emerald-600" />
                          </div>
                          {t("payments.paymentManagement")}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {t("payments.uploadProofView")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full group-hover:bg-emerald-600 transition-colors">
                          {t("payments.managePayments")}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/tenant/messages" className="group">
                    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-blue-500/10 border-0 shadow-md hover:shadow-blue-100/50 h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          {t("messages.messages")}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {t("messages.contactAdminProperty")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          {t("messages.sendMessage")}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/tenant/handover" className="group">
                    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-orange-500/10 border-0 shadow-md hover:shadow-orange-100/50 h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                            <Calendar className="h-5 w-5 text-orange-600" />
                          </div>
                          {t("handover.keyHandover")}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {t("handover.scheduleKeyExchanges")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full group-hover:bg-orange-600 transition-colors">
                          {t("handover.schedule")}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
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
