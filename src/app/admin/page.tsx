"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
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
import {
  Users,
  Building,
  Package,
  CreditCard,
  MessageSquare,
  FileText,
  Settings,
  UserCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import UserWelcomeCard from "@/components/shared/user-welcome-card";

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalProperties: number;
  totalTenants: number;
  recentConversations: number;
  pendingPayments: number;
}

interface UserInfo {
  email: string;
  full_name?: string;
  name?: string;
  role: string;
  status: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalProperties: 0,
    totalTenants: 0,
    recentConversations: 0,
    pendingPayments: 0,
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardStats();
    fetchUserInfo();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch user stats
      const { data: users } = await supabase.from("users").select("status");
      const totalUsers = users?.length || 0;
      const pendingUsers = users?.filter(u => u.status === 'pending').length || 0;

      // Fetch property stats
      const { data: properties } = await supabase.from("properties").select("id");
      const totalProperties = properties?.length || 0;

      // Fetch tenant stats
      const { data: tenants } = await supabase.from("tenant_properties").select("id");
      const totalTenants = tenants?.length || 0;

      // Fetch conversation stats (recent)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .gte("created_at", sevenDaysAgo.toISOString());
      const recentConversations = conversations?.length || 0;

      // Fetch pending payments
      const { data: payments } = await supabase
        .from("payment_proofs")
        .select("id")
        .eq("status", "pending");
      const pendingPayments = payments?.length || 0;

      setStats({
        totalUsers,
        pendingUsers,
        totalProperties,
        totalTenants,
        recentConversations,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("email, full_name, name, role, status, is_active")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserInfo(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };


  const adminCards = [
    {
      title: "User Overview",
      description: "View all users and their property assignments",
      icon: Users,
      href: "/admin/user-overview",
      color: "bg-blue-500",
      stats: `${stats.totalUsers} total`,
    },
    {
      title: "User Management",
      description: "Approve users, assign roles, manage access",
      icon: UserCheck,
      href: "/admin/users",
      color: "bg-cyan-500",
      stats: `${stats.pendingUsers} pending`,
      urgent: stats.pendingUsers > 0,
    },
    {
      title: "Properties",
      description: "Manage property listings and details",
      icon: Building,
      href: "/admin/properties",
      color: "bg-green-500",
      stats: `${stats.totalProperties} total`,
    },
    {
      title: "Tenants",
      description: "View and manage tenant information",
      icon: UserCheck,
      href: "/admin/tenants",
      color: "bg-purple-500",
      stats: `${stats.totalTenants} active`,
    },
    {
      title: "Inventory",
      description: "Manage property inventory and items",
      icon: Package,
      href: "/admin/inventory",
      color: "bg-orange-500",
    },
    {
      title: "Payments",
      description: "Review payment proofs and records",
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-red-500",
      stats: `${stats.pendingPayments} pending`,
      urgent: stats.pendingPayments > 0,
    },
    {
      title: "Conversations",
      description: "Monitor tenant communications",
      icon: MessageSquare,
      href: "/admin/conversations",
      color: "bg-indigo-500",
      stats: `${stats.recentConversations} recent`,
    },
    {
      title: "Handovers",
      description: "Manage key handovers and check-ins",
      icon: FileText,
      href: "/admin/handovers",
      color: "bg-teal-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Settings className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage users, properties, and system operations
              </p>
            </div>

            {/* Current User Info */}
            {userInfo && (
              <div className="text-right">
                <UserWelcomeCard userProfile={userInfo} showDetails={true} />
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</p>
                </div>
                {stats.pendingUsers > 0 ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Properties</p>
                  <p className="text-2xl font-bold">{stats.totalProperties}</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                  <p className="text-2xl font-bold">{stats.totalTenants}</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Functions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 shadow-md hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${card.color} text-white`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    {card.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {card.stats}
                    </span>
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                      Manage →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/users">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Review Pending Users ({stats.pendingUsers})
                  </Button>
                </Link>
                <Link href="/admin/properties">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Add New Property
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button variant="outline" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Review Payments ({stats.pendingPayments})
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}