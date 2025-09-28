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
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import UserWelcomeCard from "@/components/shared/user-welcome-card";

interface TenantDashboardProps {
  userProfile: any;
  tenantProperty: any;
}

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
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
                      <span className="text-primary text-sm font-medium">
                        {t("property.monthlyRent")}
                      </span>
                      <p className="font-bold text-lg text-primary">
                        ${tenantProperty.monthly_rent}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20 hover:bg-secondary/10 transition-colors">
                      <span className="text-secondary text-sm font-medium">
                        {t("property.leaseStart")}
                      </span>
                      <p className="font-bold text-sm text-secondary">
                        {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(
                          new Date(tenantProperty.lease_start_date)
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/5 rounded-lg border border-accent/20 hover:bg-accent/10 transition-colors">
                      <span className="text-accent text-sm font-medium">
                        {t("property.leaseEnd")}
                      </span>
                      <p className="font-bold text-sm text-accent">
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
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                      {t("inventory.inventory")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
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
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-secondary/10 border-0 shadow-md hover:shadow-secondary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                        <CreditCard className="h-8 w-8 text-secondary" />
                      </div>
                      {t("payments.paymentManagement")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("payments.uploadProofView")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-secondary transition-colors">
                      {t("payments.managePayments")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tenant/messages" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-accent/10 border-0 shadow-md hover:shadow-accent/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                        <MessageSquare className="h-8 w-8 text-accent" />
                      </div>
                      {t("messages.messages")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t("messages.contactAdminProperty")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-accent transition-colors">
                      {t("messages.sendMessage")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tenant/handover" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Calendar className="h-8 w-8 text-primary" />
                      </div>
                      {t("handover.keyHandover")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
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