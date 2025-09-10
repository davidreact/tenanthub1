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

  const isAdmin = userProfile?.role === "admin";

  // Get tenant's property if not admin
  let tenantProperty = null;
  if (!isAdmin) {
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

  // Get admin stats if admin
  let adminStats = null;
  if (isAdmin) {
    const [propertiesCount, tenantsCount, pendingPayments] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact" }),
      supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("role", "tenant"),
      supabase
        .from("payment_proofs")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

    adminStats = {
      properties: propertiesCount.count || 0,
      tenants: tenantsCount.count || 0,
      pendingPayments: pendingPayments.count || 0,
    };
  }

  return (
    <>
      <DashboardContent
        isAdmin={isAdmin}
        userProfile={userProfile}
        tenantProperty={tenantProperty}
        adminStats={adminStats}
      />
    </>
  );
}
