import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as
        | "signup"
        | "magiclink"
        | "email"
        | null;

    const supabase = await createClient();

    // Path 1: PKCE code exchange (modern magic link flow)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Code exchange failed:", error.message);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error.message)}`
            );
        }

        return await redirectBasedOnProfile(supabase, origin);
    }

    // Path 2: Token hash verification (legacy / direct token flow)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });

        if (error) {
            console.error("Token verification failed:", error.message);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error.message)}`
            );
        }

        return await redirectBasedOnProfile(supabase, origin);
    }

    // No code or token — something went wrong
    console.error("Auth callback called without code or token_hash");
    return NextResponse.redirect(`${origin}/login?error=missing_auth_params`);
}

async function redirectBasedOnProfile(
    supabase: Awaited<ReturnType<typeof createClient>>,
    origin: string
) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(`${origin}/login`);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        if (profile) {
            return NextResponse.redirect(`${origin}/dashboard`);
        } else {
            return NextResponse.redirect(`${origin}/profile-setup`);
        }
    } catch {
        // If profiles table doesn't exist yet, go to profile-setup
        return NextResponse.redirect(`${origin}/profile-setup`);
    }
}
