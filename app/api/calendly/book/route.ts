import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/calendly';

interface BookingRequest {
  eventTypeId: string;
  name: string;
  email: string;
  phone: string;
  startTime: string;
  timezone: string;
  reason?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingRequest = await request.json();

    const required = [
      'eventTypeId',
      'name',
      'email',
      'phone',
      'startTime',
      'timezone'
    ] as const;

    const missingFields = required.filter(
      field => !bookingData[field as keyof BookingRequest]
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const phoneDigits = bookingData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    // Call Calendly API
    const bookingResponse = await createBooking(
      bookingData.eventTypeId,
      {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        startTime: bookingData.startTime,
        timezone: bookingData.timezone,
        notes: bookingData.reason || ''
      }
    );

    const invitee = bookingResponse.resource;

    return NextResponse.json({
      success: true,
      data: {
        bookingUri: invitee.uri,
        status: invitee.status,
        startTime: invitee.start_time,
        endTime: invitee.end_time,
        name: invitee.name,
        email: invitee.email,
        timezone: invitee.timezone,
        confirmationNumber: `CAL-${Date.now()}`
      }
    });

  } catch (error: any) {
    console.error('Booking API error:', error);

    let errorMessage = 'Failed to create booking';
    let statusCode = 500;

    if (error.response?.data) {
      errorMessage = error.response.data.message || errorMessage;
      statusCode = error.response.status || statusCode;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}
