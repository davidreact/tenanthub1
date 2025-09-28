import { redirect } from "next/navigation";
import { createClient } from "supabase/server";
import Breadcrumb from "@/components/shared/breadcrumb";

export default async function TenantLayout({
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
