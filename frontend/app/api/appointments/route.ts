import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

// GET - Fetch appointments for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createServerSupabaseClient(token);

    // Identify the requesting user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        time_slot,
        status,
        total_price,
        payment_status,
        created_at,
        haircut_id,
        barber_id,
        haircuts ( name, price ),
        barbers ( full_name )
      `)
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("[appointments GET] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data ?? [] });
  } catch (err) {
    console.error("[appointments GET] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createServerSupabaseClient(token);

    const body = await request.json();
    const { appointment_date, time_slot, haircut_id, status, total_price, payment_status, user_id } = body;

    if (!appointment_date || !time_slot) {
      return NextResponse.json({ error: "appointment_date and time_slot are required" }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      appointment_date,
      time_slot,
      status: status ?? "pending",
      payment_status: payment_status ?? "unpaid",
    };

    if (haircut_id) insertData.haircut_id = haircut_id;
    if (total_price !== undefined) insertData.total_price = total_price;

    // Attach user_id if we have an authenticated user
    if (user_id) {
      insertData.user_id = user_id;
    } else if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) insertData.user_id = user.id;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[appointments POST] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data }, { status: 201 });
  } catch (err) {
    console.error("[appointments POST] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
