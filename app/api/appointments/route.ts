import { NextRequest, NextResponse } from "next/server";

// GET - Get appointments (mock data - database disabled)
export async function GET(request: NextRequest) {
  try {
    // Return empty appointments array
    return NextResponse.json({ appointments: [] });
  } catch (error) {
    console.error("[v0] Get appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST - Create appointment (mock response - database disabled)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      barber_id,
      service_name,
      service_price,
      service_duration,
      appointment_date,
      appointment_time,
    } = data;

    // Validate required fields
    if (!barber_id || !service_name || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Return mock success response
    const appointment = {
      id: Date.now(),
      customer_id: 1,
      barber_id,
      service_name,
      service_price,
      service_duration,
      appointment_date,
      appointment_time,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("[v0] Create appointment error:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
