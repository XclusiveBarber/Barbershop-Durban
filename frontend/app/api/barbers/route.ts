import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This pulls the URL from the .env.local file you just created
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // This calls the "GetBarbers" method in your C# BarbersController
    const response = await fetch(`${backendUrl}/api/barbers`, {
      cache: 'no-store' // Ensures you always get the latest data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch barbers from backend');
    }

    const barbers = await response.json();
    
    // Send the real database data back to your frontend UI
    return NextResponse.json({ barbers });
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}