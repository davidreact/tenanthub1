import Breadcrumb from "@/components/shared/breadcrumb";
import { PropertyManagerDashboard, TenantDashboard } from "@/components/dashboards";

interface DashboardContentProps {
  userProfile: any;
  tenantProperty: any;
  adminStats: any;
}

/**
 * @description Main dashboard content component that renders role-specific dashboards with breadcrumb navigation.
 */
export default function DashboardContent({
  userProfile,
  tenantProperty,
  adminStats,
}: DashboardContentProps) {
  return (
    <main className="w-full bg-hero-gradient min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {userProfile?.role === 'property_manager' ? (
          <PropertyManagerDashboard userProfile={userProfile} adminStats={adminStats} />
        ) : (
          <TenantDashboard userProfile={userProfile} tenantProperty={tenantProperty} />
        )}
      </div>
    </main>
  );
}
