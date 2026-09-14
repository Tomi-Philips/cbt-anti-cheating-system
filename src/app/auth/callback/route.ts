import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          switch (profile.role) {
            case "admin":
              return NextResponse.redirect(`${origin}/admin`);
            case "lecturer":
              return NextResponse.redirect(`${origin}/lecturer`);
            case "student":
              return NextResponse.redirect(`${origin}/student`);
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
