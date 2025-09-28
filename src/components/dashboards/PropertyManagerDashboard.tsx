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
  Calendar,
} from "lucide-react";
import Link from "next/link";
import UserWelcomeCard from "@/components/shared/user-welcome-card";

interface PropertyManagerDashboardProps {
  userProfile: any;
  adminStats: any;
}

export default function PropertyManagerDashboard({
  userProfile,
  adminStats,
}: PropertyManagerDashboardProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Property Manager Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your assigned properties and tenants
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
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Tenants
              </CardTitle>
              <Users className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {adminStats?.tenants || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tenants in my properties
              </p>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-card via-card to-secondary/5 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <CreditCard className="h-5 w-5 text-secondary group-hover:text-secondary/80 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
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
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  My Properties
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  View and manage properties assigned to me
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  View Properties
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/tenants" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-secondary/10 border-0 shadow-md hover:shadow-secondary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  My Tenants
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Manage tenants in my properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-secondary transition-colors">
                  View Tenants
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/payments" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-accent/10 border-0 shadow-md hover:shadow-accent/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <CreditCard className="h-8 w-8 text-accent" />
                  </div>
                  Payment Reviews
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Review and approve tenant payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-accent transition-colors">
                  Review Payments
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/messages" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-primary/10 border-0 shadow-md hover:shadow-primary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  Tenant Messages
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Communicate with tenants in my properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-primary transition-colors">
                  View Messages
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/inventory" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-secondary/10 border-0 shadow-md hover:shadow-secondary/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                    <Package className="h-8 w-8 text-secondary" />
                  </div>
                  Property Inventory
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Manage inventory for my properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-secondary transition-colors">
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pm-dashboard/handovers" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-card via-card to-accent/10 border-0 shadow-md hover:shadow-accent/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <Calendar className="h-8 w-8 text-accent" />
                  </div>
                  Key Handovers
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Schedule and manage key exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full group-hover:bg-accent transition-colors">
                  Manage Handovers
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}