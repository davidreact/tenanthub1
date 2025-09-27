import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import DashboardContent from "@/components/dashboard-content";

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
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Redirect admin to admin dashboard
  if (userProfile?.role === "admin") {
    console.log("Redirecting admin to /admin dashboard");
    redirect("/admin");
  }

  // Get tenant's property (for tenants only)
  let tenantProperty = null;
  if (userProfile?.role === "tenant") {
    const { data } = await supabase
      .from("tenant_properties")
      .select(
        `
        *,
        properties (*)
      `,
      )
      .eq("tenant_id", user.id)
      .eq("status", "active")
      .single();

    tenantProperty = data;
  }

  // Get stats based on user role
  let adminStats = null;
  if (userProfile?.role === 'property_manager') {
    // Get property manager's properties first
    const { data: managerProperties, error: propError } = await supabase
      .from("properties")
      .select("id, address")
      .eq("created_by", user.id);

    console.log("Property Manager Properties Query:", {
      userId: user.id,
      properties: managerProperties,
      error: propError,
      count: managerProperties?.length || 0
    });

    const propertyIds = managerProperties?.map(p => p.id) || [];

    if (propertyIds.length > 0) {
      // Get tenant property IDs for payment query
      const { data: tenantPropertyIds } = await supabase
        .from("tenant_properties")
        .select("id")
        .in("property_id", propertyIds);

      const tpIds = tenantPropertyIds?.map(tp => tp.id) || [];

      // Count tenants in their properties
      const { count: tenantsCount, error: tenantError } = await supabase
        .from("tenant_properties")
        .select("tenant_id", { count: "exact", head: true })
        .in("property_id", propertyIds);

      // Count pending payments for their properties
      const { count: pendingPaymentsCount, error: paymentError } = await supabase
        .from("payment_proofs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("tenant_property_id", tpIds);

      console.log("Property Manager Stats:", {
        properties: propertyIds.length,
        tenants: tenantsCount || 0,
        pendingPayments: pendingPaymentsCount || 0,
        tenantError,
        paymentError
      });

      adminStats = {
        properties: propertyIds.length,
        tenants: tenantsCount || 0,
        pendingPayments: pendingPaymentsCount || 0,
      };
    } else {
      adminStats = {
        properties: 0,
        tenants: 0,
        pendingPayments: 0,
      };
    }
  }

  return (
    <>
      <DashboardContent
        userProfile={userProfile}
        tenantProperty={tenantProperty}
        adminStats={adminStats}
      />
    </>
  );
}
