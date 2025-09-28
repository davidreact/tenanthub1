import { createClient as createServerClient } from '../../supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced sign-in that includes role in JWT claims
 * Follows Supabase best practices for role-based access
 */
export async function signInWithRole(email: string, password: string) {
  try {
    // Use server client for server-side operations
    const supabase = await createServerClient();

    // Sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return { data: null, error: authError };
    }

    // Fetch user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status, is_active')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return { data: authData, error: null }; // Still return auth data
    }

    // Check if user is approved and active
    if (userData.status !== 'approved') {
      await supabase.auth.signOut();
      return {
        data: null,
        error: { message: 'Account not approved. Please contact administrator.' }
      };
    }

    if (!userData.is_active) {
      await supabase.auth.signOut();
      return {
        data: null,
        error: { message: 'Account has been disabled.' }
      };
    }

    // Update JWT with role (Supabase best practice)
    if (userData.role) {
      try {
        await supabase.auth.updateUser({
          data: { role: userData.role }
        });
        // Refresh the session to get updated JWT with role
        await supabase.auth.refreshSession();
      } catch (jwtError) {
        console.error('Error updating JWT claims:', jwtError);
        // Continue anyway - role will be checked server-side
      }
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
}

/**
 * Sign up with role assignment (for admin-created users)
 */
export async function signUpWithRole(
  email: string,
  password: string,
  role: 'admin' | 'property_manager' | 'tenant' = 'tenant'
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  });

  return { data, error };
}

/**
 * Update user role in database
 * Note: User must re-authenticate to get updated JWT with new role
 */
export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await createServerClient();

    // Update role in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Send notification to user about role change
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Role Updated',
        message: `Your role has been changed to ${newRole}. Please sign out and sign back in to apply the changes.`,
        type: 'info'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue anyway
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { error };
  }
}

/**
 * Get current user's role from JWT (fast, no DB call)
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role || null;
  } catch {
    return null;
  }
}

/**
 * Check if current user has admin role
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

/**
 * Check if current user has property manager role
 */
export async function isCurrentUserPropertyManager(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'property_manager';
}