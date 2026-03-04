import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    // Skip auth for dev showcase page and auth callback
    if (
        request.nextUrl.pathname.startsWith("/dev") ||
        request.nextUrl.pathname.startsWith("/auth/callback")
    ) {
        return NextResponse.next();
    }

    // If Supabase isn't configured yet, allow all routes
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === "your_supabase_project_url"
    ) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
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

    const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/verify");

    const isProfileSetup =
        request.nextUrl.pathname.startsWith("/profile-setup");

    // Not logged in → redirect to login (unless already on auth page or profile-setup)
    if (!user && !isAuthPage && !isProfileSetup && request.nextUrl.pathname !== "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Logged in → redirect away from login/verify pages
    if (user && isAuthPage) {
        // Check if user has a profile before deciding where to redirect
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        const url = request.nextUrl.clone();
        url.pathname = profile ? "/dashboard" : "/profile-setup";
        return NextResponse.redirect(url);
    }

    // Logged in + on profile-setup → allow only if no profile exists
    if (user && isProfileSetup) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        // Already has profile → go to dashboard
        if (profile) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
        // No profile → allow access to profile-setup
    }

    return supabaseResponse;
}
