import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const CALENDLY_API_BASE = 'https://api.calendly.com';
    const accessToken = process.env.CALENDLY_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing CALENDLY_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    const userUri =
      'https://api.calendly.com/users/b8bb70ff-ca24-4953-9953-cb0c9cc25ea6';

    const response = await axios.get(
      `${CALENDLY_API_BASE}/user_availability_schedules`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          user: userUri,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Calendly availability fetch failed', error?.response?.data);
    return NextResponse.json(
      { error: error?.response?.data || error.message },
      { status: 400 }
    );
  }
}
