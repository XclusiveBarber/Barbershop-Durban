import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET - Fetch appointments for the authenticated user
export async function GET(_request: NextRequest) {
  try {
    // createSupabaseServerClient reads the sb-*-auth-token cookie set by
    // @supabase/ssr — no manual Authorization header needed.
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    // Support both "appointment_time" (from booking-system) and "time_slot" (legacy)
    const {
      appointment_date,
      appointment_time,
      time_slot,
      barber_id,
      haircut_id,
      status,
      total_price,
      payment_status,
    } = body;

    const resolvedTimeSlot = time_slot ?? appointment_time;

    if (!appointment_date || !resolvedTimeSlot) {
      return NextResponse.json(
        { error: "appointment_date and appointment_time are required" },
        { status: 400 }
      );
    }

    // Identify the requesting user from the session cookie
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to book." }, { status: 401 });
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      appointment_date,
      time_slot: resolvedTimeSlot,
      status: status ?? "pending",
      payment_status: payment_status ?? "unpaid",
    };

    if (barber_id) insertData.barber_id = barber_id;
    if (haircut_id) insertData.haircut_id = haircut_id;
    if (total_price !== undefined) insertData.total_price = total_price;

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
