"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  Users,
  CreditCard,
  MessageSquare,
  Package,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import UserWelcomeCard from "@/components/shared/user-welcome-card";

interface PropertyManagerDashboardProps {
  userProfile: any;
  adminStats: any;
}

/**
 * @description Displays the property manager dashboard with statistics and navigation links for managing properties and tenants.
 */
export default function PropertyManagerDashboard({
  userProfile,
  adminStats,
}: PropertyManagerDashboardProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("dashboard.propertyManagerDashboard")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("dashboard.manageAssignedPropertiesTenants")}
            </p>
          </div>
          <UserWelcomeCard userProfile={userProfile} />
        </div>
      </div>

      {/* Property Manager Dashboard */}
      <div className="space-y-8">
        {/* Property Manager Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                  {t("dashboard.myProperties")}
                </CardTitle>
              <Building className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {adminStats?.properties || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.propertiesIManage")}
              </p>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.myTenants")}
              </CardTitle>
              <Users className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {adminStats?.tenants || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.tenantsInMyProperties")}
              </p>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-secondary/5 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.pendingReviews")}
              </CardTitle>
              <CreditCard className="h-5 w-5 text-secondary group-hover:text-secondary/80 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {adminStats?.pendingPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.paymentsToReview")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Property Manager Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/pm-dashboard/properties" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <Building className="h-6 w-6" />
                  </div>
                  {t("dashboard.myProperties")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.viewAndManagePropertiesAssigned")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.viewProperties")}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/tenants" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  {t("dashboard.myTenants")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.manageTenantsInMyProperties")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.viewTenants")}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/payments" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500 text-white">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  {t("dashboard.paymentReviews")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.reviewAndApproveTenantPayments")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.reviewPayments")}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/messages" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500 text-white">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  {t("dashboard.tenantMessages")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.communicateWithTenantsInMyProperties")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.viewMessages")}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/inventory" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500 text-white">
                    <Package className="h-6 w-6" />
                  </div>
                  {t("dashboard.propertyInventory")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.manageInventoryForMyProperties")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.manageInventory")}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/handovers" className="group">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500 text-white">
                    <FileText className="h-6 w-6" />
                  </div>
                  {t("dashboard.keyHandovers")}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {t("dashboard.scheduleAndManageKeyExchanges")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  {t("dashboard.manageHandovers")}
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}