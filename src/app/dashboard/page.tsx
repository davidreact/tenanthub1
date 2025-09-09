import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  Package, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  Settings,
  Users,
  Building,
  Shield
} from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile with role
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = userProfile?.role === 'admin';

  // Get tenant's property if not admin
  let tenantProperty = null;
  if (!isAdmin) {
    const { data } = await supabase
      .from('tenant_properties')
      .select(`
        *,
        properties (*)
      `)
      .eq('tenant_id', user.id)
      .eq('status', 'active')
      .single();
    
    tenantProperty = data;
  }

  // Get admin stats if admin
  let adminStats = null;
  if (isAdmin) {
    const [propertiesCount, tenantsCount, pendingPayments] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'tenant'),
      supabase.from('payment_proofs').select('id', { count: 'exact' }).eq('status', 'pending')
    ]);

    adminStats = {
      properties: propertiesCount.count || 0,
      tenants: tenantsCount.count || 0,
      pendingPayments: pendingPayments.count || 0
    };
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Admin Dashboard' : 'Tenant Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin 
                ? 'Manage properties, tenants, and all aspects of your rental business'
                : `Welcome back, ${userProfile?.full_name || userProfile?.name || 'Tenant'}`
              }
            </p>
          </div>

          {isAdmin ? (
            // Admin Dashboard
            <div className="space-y-8">
              {/* Admin Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats?.properties}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats?.tenants}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats?.pendingPayments}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Manage Properties
                    </CardTitle>
                    <CardDescription>
                      Add, edit, and manage all properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/properties">
                      <Button className="w-full">View Properties</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Manage Tenants
                    </CardTitle>
                    <CardDescription>
                      Add, edit, and manage tenant accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/tenants">
                      <Button className="w-full">View Tenants</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Management
                    </CardTitle>
                    <CardDescription>
                      Review and approve payment proofs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/payments">
                      <Button className="w-full">View Payments</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Conversations
                    </CardTitle>
                    <CardDescription>
                      Manage tenant communications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/conversations">
                      <Button className="w-full">View Messages</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Inventory Management
                    </CardTitle>
                    <CardDescription>
                      Manage property inventories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/inventory">
                      <Button className="w-full">View Inventory</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Key Handovers
                    </CardTitle>
                    <CardDescription>
                      Schedule and manage key handovers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/handovers">
                      <Button className="w-full">View Schedule</Button>
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
                        Your Property
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{tenantProperty.properties.name}</h3>
                          <p className="text-gray-600">{tenantProperty.properties.address}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Monthly Rent</span>
                            <p className="font-semibold">${tenantProperty.monthly_rent}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Lease Start</span>
                            <p className="font-semibold">{new Date(tenantProperty.lease_start_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Lease End</span>
                            <p className="font-semibold">{new Date(tenantProperty.lease_end_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Status</span>
                            <Badge variant={tenantProperty.status === 'active' ? 'default' : 'secondary'}>
                              {tenantProperty.status}
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
                          Inventory
                        </CardTitle>
                        <CardDescription>
                          View and manage property inventory
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/tenant/inventory">
                          <Button className="w-full">View Inventory</Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payments
                        </CardTitle>
                        <CardDescription>
                          Upload payment proofs and view history
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/tenant/payments">
                          <Button className="w-full">Manage Payments</Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Messages
                        </CardTitle>
                        <CardDescription>
                          Contact admin about your property
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/tenant/messages">
                          <Button className="w-full">Send Message</Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Key Handover
                        </CardTitle>
                        <CardDescription>
                          Schedule key exchanges
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/tenant/handover">
                          <Button className="w-full">Schedule</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Property Assigned</CardTitle>
                    <CardDescription>
                      You don't have any property assigned to your account. Please contact the administrator.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}