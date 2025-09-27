import { redirect } from "next/navigation";
import { createClient } from "supabase/server";
import Breadcrumb from "@/components/breadcrumb";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user role from database
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !userData || !['admin', 'property_manager'].includes(userData.role)) {
    redirect("/pm-dashboard"); // or unauthorized page
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Breadcrumb />
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
