import { createClient as createServerClient } from '../../supabase/server';

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
 * Update user role and refresh JWT claims
 * Call this when admin changes a user's role
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

    // If updating current user, refresh their JWT
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      await supabase.auth.updateUser({
        data: { role: newRole }
      });
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