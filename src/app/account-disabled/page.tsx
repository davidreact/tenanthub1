import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, Mail } from "lucide-react";
import Link from "next/link";

export default function AccountDisabled() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
            <UserX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Account Disabled</CardTitle>
          <CardDescription>
            Your account has been disabled by an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-4">
              For security or policy reasons, your account access has been temporarily disabled.
              You cannot sign in until an administrator re-enables your account.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Mail className="h-4 w-4 inline mr-2" />
              Please contact support if you believe this is an error.
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/sign-in">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}