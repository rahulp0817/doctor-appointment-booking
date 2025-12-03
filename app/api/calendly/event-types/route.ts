import { NextResponse } from 'next/server';
import { getCalendlyClient } from '@/lib/calendly';

export async function GET() {
  try {
    const calendly = getCalendlyClient();
    const response = await calendly.get('/event_types', {
      params: {
        user: 'https://api.calendly.com/users/b8bb70ff-ca24-4953-9953-cb0c9cc25ea6',
        active: true
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching Calendly event types:', error);
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Failed to fetch event types',
        error: error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}
