import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Mail } from "lucide-react";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            Your account registration was not approved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-4">
              Unfortunately, your account registration was reviewed and not approved at this time.
              This decision helps maintain the security and integrity of our platform.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Mail className="h-4 w-4 inline mr-2" />
              For questions about this decision, please contact our support team.
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/sign-up">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}