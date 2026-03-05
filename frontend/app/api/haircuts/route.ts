import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("haircuts")
      .select("id, name, price, description, image_url")
      .order("name");

    if (error) {
      console.error("[haircuts] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ haircuts: data ?? [] });
  } catch (err) {
    console.error("[haircuts] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to fetch haircuts" }, { status: 500 });
  }
}
