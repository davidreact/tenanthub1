import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface UserWelcomeCardProps {
  userProfile: {
    full_name?: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    is_active?: boolean;
  };
  showDetails?: boolean; // For admin dashboard - shows status and active badges
}

export default function UserWelcomeCard({ userProfile, showDetails = false }: UserWelcomeCardProps) {
  const displayName = userProfile?.full_name || userProfile?.name || userProfile?.email || "User";
  const roleDisplay = userProfile?.role?.replace('_', ' ') || "User";

  return (
    <div className="text-right">
      <div className="text-sm">
        <p className="font-medium text-muted-foreground">Welcome back</p>
        <p className="font-semibold text-foreground text-lg">
          {displayName}
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <Badge className={
            userProfile?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            userProfile?.role === 'property_manager' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }>
            {roleDisplay}
          </Badge>
          {showDetails && userProfile?.status && (
            <Badge className={
              userProfile.status === 'approved' ? 'bg-green-100 text-green-800' :
              userProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {userProfile.status}
            </Badge>
          )}
          {showDetails && (
            <Badge variant={userProfile?.is_active ? "default" : "secondary"}>
              {userProfile?.is_active ? 'Active' : 'Disabled'}
            </Badge>
          )}
        </div>
        {showDetails && userProfile?.email && (
          <p className="text-muted-foreground text-xs mt-1">{userProfile.email}</p>
        )}
      </div>
    </div>
  );
}