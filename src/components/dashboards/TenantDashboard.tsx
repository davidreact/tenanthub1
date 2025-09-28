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
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import UserWelcomeCard from "@/components/shared/user-welcome-card";

interface TenantDashboardProps {
  userProfile: any;
  tenantProperty: any;
}

/**
 * @description Displays the tenant dashboard with property information and navigation links for tenant-specific actions.
 */
export default function TenantDashboard({
  userProfile,
  tenantProperty,
}: TenantDashboardProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tenant Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View your property and lease information
            </p>
          </div>
          <UserWelcomeCard userProfile={userProfile} />
        </div>
      </div>

      {/* Tenant Dashboard */}
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
                    <div className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors">
                      <span className="text-foreground text-sm font-medium">
                        {t("property.monthlyRent")}
                      </span>
                      <p className="font-bold text-lg text-foreground">
                        ${tenantProperty.monthly_rent}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors">
                      <span className="text-foreground text-sm font-medium">
                        {t("property.leaseStart")}
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(
                          new Date(tenantProperty.lease_start_date)
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors">
                      <span className="text-foreground text-sm font-medium">
                        {t("property.leaseEnd")}
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(
                          new Date(tenantProperty.lease_end_date)
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors">
                      <span className="text-foreground text-sm font-medium">
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
                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500 text-white">
                        <Package className="h-6 w-6" />
                      </div>
                      {t("inventory.inventory")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                      {t("inventory.viewManageProperty")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-primary transition-colors">
                      {t("inventory.viewInventory")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tenant/payments" className="group">
                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500 text-white">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      {t("payments.paymentManagement")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                      {t("payments.uploadProofView")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-primary transition-colors">
                      {t("payments.managePayments")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tenant/messages" className="group">
                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500 text-white">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      {t("messages.messages")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                      {t("messages.contactAdminProperty")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-primary transition-colors">
                      {t("messages.sendMessage")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tenant/handover" className="group">
                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500 text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      {t("handover.keyHandover")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                      {t("handover.scheduleKeyExchanges")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-primary transition-colors">
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
    </>
  );
}