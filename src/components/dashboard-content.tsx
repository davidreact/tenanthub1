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
import UserWelcomeCard from "@/components/user-welcome-card";

interface DashboardContentProps {
  userProfile: any;
  tenantProperty: any;
  adminStats: any;
}

export default function DashboardContent({
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {userProfile?.role === 'property_manager'
                  ? "Property Manager Dashboard"
                  : "Tenant Dashboard"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {userProfile?.role === 'property_manager'
                  ? "Manage your assigned properties and tenants"
                  : "View your property and lease information"}
              </p>
            </div>
            <UserWelcomeCard userProfile={userProfile} />
          </div>
        </div>

        {userProfile?.role === 'property_manager' ? (
          // Property Manager Dashboard
          <div className="space-y-8">
          {/* Property Manager Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Properties
                </CardTitle>
                <Building className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {adminStats?.properties || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Properties I manage
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-blue-500/5 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Tenants
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600 group-hover:text-blue-500 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {adminStats?.tenants || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tenants in my properties
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-orange-500/5 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reviews
                </CardTitle>
                <CreditCard className="h-5 w-5 text-orange-600 group-hover:text-orange-500 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {adminStats?.pendingPayments || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payments to review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Property Manager Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/pm-dashboard/properties" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-emerald-500/10 border-0 shadow-md hover:shadow-emerald-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <Building className="h-5 w-5 text-emerald-600" />
                    </div>
                    My Properties
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    View and manage properties assigned to me
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-emerald-600 transition-colors">
                    View Properties
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pm-dashboard/tenants" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-blue-500/10 border-0 shadow-md hover:shadow-blue-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    My Tenants
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Manage tenants in my properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-blue-600 transition-colors">
                    View Tenants
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pm-dashboard/payments" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-orange-500/10 border-0 shadow-md hover:shadow-orange-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    Payment Reviews
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Review and approve tenant payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-orange-600 transition-colors">
                    Review Payments
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pm-dashboard/messages" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-purple-500/10 border-0 shadow-md hover:shadow-purple-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    Tenant Messages
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Communicate with tenants in my properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-purple-600 transition-colors">
                    View Messages
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pm-dashboard/inventory" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-indigo-500/10 border-0 shadow-md hover:shadow-indigo-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    Property Inventory
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Manage inventory for my properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-indigo-600 transition-colors">
                    Manage Inventory
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pm-dashboard/handovers" className="group">
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-rose-500/10 border-0 shadow-md hover:shadow-rose-100/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                      <Calendar className="h-5 w-5 text-rose-600" />
                    </div>
                    Key Handovers
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Schedule and manage key exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-rose-600 transition-colors">
                    Manage Handovers
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
