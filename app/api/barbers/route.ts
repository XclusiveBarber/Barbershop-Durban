import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock barbers data
    const barbers = [
      {
        id: 1,
        name: 'Thabo Mkhize',
        phone: '+27821111111',
        specialty: 'Master Barber',
        experience: '10+ years',
        image_url: '/placeholder.svg?height=300&width=300',
        is_active: 1
      },
      {
        id: 2,
        name: 'Sipho Nkosi',
        phone: '+27822222222',
        specialty: 'Fade Specialist',
        experience: '7+ years',
        image_url: '/placeholder.svg?height=300&width=300',
        is_active: 1
      },
      {
        id: 3,
        name: 'Mandla Dlamini',
        phone: '+27823333333',
        specialty: 'Beard Expert',
        experience: '8+ years',
        image_url: '/placeholder.svg?height=300&width=300',
        is_active: 1
      }
    ];

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error('[v0] Get barbers error:', error);
    return NextResponse.json({ error: 'Failed to fetch barbers' }, { status: 500 });
  }
}
