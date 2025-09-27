"use client";

import { useState } from "react";
import { signInWithRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

/**
 * Example component showing how to use the enhanced sign-in with JWT roles
 * This demonstrates the recommended Supabase authentication pattern
 */
export function AuthExample() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the enhanced sign-in function that includes role in JWT
      const { data, error } = await signInWithRole(email, password);

      if (error) {
        toast({
          title: "Sign In Failed",
          description: (error as any)?.message || "Authentication failed",
          variant: "destructive",
        });
        return;
      }

      if (data?.user) {
        toast({
          title: "Welcome!",
          description: "Successfully signed in with role-based access.",
        });

        // Redirect based on user role (from JWT)
        // The middleware will handle the routing automatically
        window.location.href = "/pm-dashboard";
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Secure Sign In</CardTitle>
        <CardDescription>
          Demonstrates JWT-based role authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing In..." : "Sign In with JWT Roles"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong><br />
            1. Signs in user<br />
            2. Fetches role from database<br />
            3. Updates JWT with role claim<br />
            4. RLS policies use JWT role for access control
          </p>
        </div>
      </CardContent>
    </Card>
  );
}