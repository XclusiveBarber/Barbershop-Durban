import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

// GET - Fetch a single appointment
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createServerSupabaseClient(token);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, appointment_date, time_slot, status, total_price, payment_status, created_at,
        haircuts ( name, price ),
        barbers ( full_name )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment: data });
  } catch (err) {
    console.error("[appointment GET] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }
}

// PATCH - Update an appointment (e.g. reschedule)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createServerSupabaseClient(token);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const updates = await request.json();
    const allowed = ["appointment_date", "time_slot", "status"];
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(safeUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err) {
    console.error("[appointment PATCH] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

// DELETE - Cancel an appointment (sets status to 'cancelled')
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createServerSupabaseClient(token);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[appointment DELETE] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
