"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const createTenantAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("fullName")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password || !fullName) {
    return encodedRedirect(
      "error",
      "/admin/tenants",
      "Email, password, and full name are required",
    );
  }

  try {
    // Get current admin user for logging
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Create the user in Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          email: email,
          role: "tenant",
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return encodedRedirect("error", "/admin/tenants", authError.message);
    }

    if (!user) {
      return encodedRedirect(
        "error",
        "/admin/tenants",
        "Failed to create user",
      );
    }

    // Insert the user into the public.users table
    const { error: dbError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: email,
        full_name: fullName,
        name: fullName,
        role: "tenant",
        is_active: true,
        token_identifier: user.id,
      },
      {
        onConflict: "id",
      },
    );

    if (dbError) {
      console.error("Database error:", dbError);
      return encodedRedirect(
        "error",
        "/admin/tenants",
        "Failed to create tenant profile: " + dbError.message,
      );
    }

    // Create admin log notification
    if (currentUser) {
      const { createAdminLogNotification } = await import(
        "@/lib/notifications"
      );
      await createAdminLogNotification({
        adminUserId: currentUser.id,
        action: "Created new tenant",
        entityType: "tenant",
        entityId: user.id,
        details: { tenantName: fullName, tenantEmail: email },
      });
    }

    // Success - redirect with success message
    encodedRedirect(
      "success",
      "/admin/tenants",
      `Tenant ${fullName} has been created successfully. They will receive an email confirmation.`,
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return encodedRedirect(
      "error",
      "/admin/tenants",
      "An unexpected error occurred while creating the tenant",
    );
  }
};

export const markNotificationAsReadAction = async (notificationId: string) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const updateUserLanguageAction = async (language: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      language: language,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Error updating language preference:", error);
    throw error;
  }
};

export const updateUserProfileAction = async (formData: FormData) => {
  const fullName = formData.get("fullName")?.toString();
  const telephoneNumber = formData.get("telephoneNumber")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/profile", "User not authenticated");
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        telephone_number: telephoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user profile:", error);
      return encodedRedirect(
        "error",
        "/profile",
        "Failed to update profile: " + error.message,
      );
    }

    return encodedRedirect(
      "success",
      "/profile",
      "Profile updated successfully!",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return encodedRedirect(
      "error",
      "/profile",
      "An unexpected error occurred while updating the profile",
    );
  }
};
