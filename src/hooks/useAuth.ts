"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../supabase/client';

const supabase = createClient();

/**
 * Hook that handles JWT role setting after authentication
 * This runs on the client side after successful sign-in
 */
export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Fetch user role from database
          const { data: userData, error } = await supabase
            .from('users')
            .select('role, status, is_active')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }

          // Check if user is approved and active
          if (userData.status !== 'approved') {
            await supabase.auth.signOut();
            router.push('/pending-approval');
            return;
          }

          if (!userData.is_active) {
            await supabase.auth.signOut();
            router.push('/account-disabled');
            return;
          }

          // Update JWT with role (client-side)
          if (userData.role) {
            try {
              await supabase.auth.updateUser({
                data: { role: userData.role }
              });
            } catch (jwtError) {
              console.error('Error updating JWT claims:', jwtError);
            }
          }

          // Redirect based on role
          const role = userData.role;
          if (role === 'admin') {
            router.push('/admin');
          } else if (role === 'property_manager') {
            router.push('/pm-dashboard');
          } else {
            router.push('/tenant');
          }

        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }

      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        router.push('/sign-in');
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check current session on mount
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already signed in, ensure JWT has role
        const jwtRole = session.user.user_metadata?.role;
        if (!jwtRole) {
          // JWT doesn't have role, fetch and update
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (userData?.role) {
            await supabase.auth.updateUser({
              data: { role: userData.role }
            });
          }
        }
      }
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return { supabase };
}