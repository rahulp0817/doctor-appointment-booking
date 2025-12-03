import { getAvailability } from "@/lib/calendly";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request with body:', JSON.stringify(body, null, 2));
    
    const { eventTypeId, date, timezone, startTime, endTime } = body;

    if (!eventTypeId || !date) {
      console.error('Missing required fields:', { eventTypeId, date });
      return NextResponse.json(
        { success: false, error: "Missing required fields: eventTypeId and date are required" },
        { status: 400 }
      );
    }

    console.log('Fetching availability with params:', {
      eventTypeId,
      date,
      timezone: timezone || 'Asia/Calcutta',
      startTime: startTime || 'Not provided (using default)',
      endTime: endTime || 'Not provided (using default)'
    });

    const slots = await getAvailability({
      eventTypeId,
      date,
      timezone: timezone || 'Asia/Calcutta',
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });

    console.log(`Found ${slots.length} available slots`);
    return NextResponse.json({ 
      success: true, 
      data: { 
        availableSlots: slots 
      } 
    });
  } catch (err: any) {
    console.error('Error in slots API:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || 'Failed to fetch available slots',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
