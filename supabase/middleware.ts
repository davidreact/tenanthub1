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
      !path.includes("/dashboard") &&
      !path.includes("/profile");
    const isPublicRoute =
      path === "/" ||
      path.startsWith("/sign-in") ||
      path.startsWith("/sign-up") ||
      path.startsWith("/forgot-password") ||
      isTempobookPublic;

    // Redirect unauthenticated users away from all non-public routes
    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect authenticated users away from auth pages
    if (user && (path === "/sign-in" || path === "/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
