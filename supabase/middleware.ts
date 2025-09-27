import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Publicly accessible routes
    // Allow Tempo storyboards only when not navigating to protected app paths within them
    const isTempobook = path.startsWith("/tempobook");
    const isTempobookPublic =
      isTempobook &&
      !path.includes("/admin") &&
      !path.includes("/tenant") &&
      !path.includes("/pm-dashboard") &&
      !path.includes("/profile");
    const isPublicRoute =
      path === "/" ||
      path.startsWith("/sign-in") ||
      path.startsWith("/sign-up") ||
      path.startsWith("/forgot-password") ||
      path.startsWith("/pending-approval") ||
      path.startsWith("/account-disabled") ||
      path.startsWith("/access-denied") ||
      isTempobookPublic;

    // Check user status and active state for authenticated users
    if (user && !isPublicRoute) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('status, is_active, role')
          .eq('id', user.id)
          .single();

        // Check if user is active
        if (!userData?.is_active) {
          return NextResponse.redirect(new URL("/account-disabled", request.url));
        }

        // Check if user is approved
        if (userData?.status !== 'approved') {
          if (userData?.status === 'pending') {
            return NextResponse.redirect(new URL("/pending-approval", request.url));
          } else {
            return NextResponse.redirect(new URL("/access-denied", request.url));
          }
        }

        // Check role-based access for admin routes
        if (path.startsWith('/admin')) {
          const allowedRoles = ['admin', 'property_manager'];
          if (!allowedRoles.includes(userData?.role)) {
            return NextResponse.redirect(new URL("/pm-dashboard", request.url));
          }
        }
      } catch (error) {
        console.error('User status check error:', error);
        // Continue with normal flow if check fails
      }
    }

    // Redirect unauthenticated users away from all non-public routes
    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect authenticated users away from auth pages
    if (user && (path === "/sign-in" || path === "/sign-up")) {
      return NextResponse.redirect(new URL("/pm-dashboard", request.url));
    }

    return response;
  } catch (e) {
    console.error("Middleware error:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
