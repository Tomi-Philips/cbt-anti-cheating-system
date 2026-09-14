import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/callback"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        const url = request.nextUrl.clone();
        url.pathname = getDashboardPath(profile.role);
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Protected routes — require auth
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Get user profile for role-based access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  const role = profile.role;
  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboardPath(role);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/lecturer") && role !== "lecturer") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboardPath(role);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/student") && role !== "student") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboardPath(role);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "lecturer":
      return "/lecturer";
    case "student":
      return "/student";
    default:
      return "/auth/login";
  }
}
