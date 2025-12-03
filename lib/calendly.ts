import axios, { AxiosInstance } from 'axios';
import { TimeSlot } from './types';
import { zonedTimeToUtc } from 'date-fns-tz';

const CALENDLY_API_BASE = 'https://api.calendly.com';

export const getCalendlyClient = (): AxiosInstance => {
  const accessToken = process.env.CALENDLY_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('CALENDLY_ACCESS_TOKEN is not set in environment variables');
  }

  return axios.create({
    baseURL: CALENDLY_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
};

export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: string;
  description_plain: string | null;
  description_html: string | null;
  profile: {
    type: string;
    name: string;
    owner: string;
  };
  custom_questions: Array<{
    name: string;
    type: string;
    required: boolean;
    position: number;
    enabled: boolean;
    answer_choices: string[];
    include_other: boolean;
  }>;
  locations: Array<{
    type: string;
    location: string;
  }>;
  created_at: string;
  updated_at: string;
  internal_note?: string | null;
  deleted_at?: string | null;
}

export interface CalendlyEventTypesResponse {
  collection: CalendlyEventType[];
  pagination: {
    count: number;
    next_page: string | null;
    previous_page: string | null;
    next_page_token: string | null;
    previous_page_token: string | null;
  };
}

export interface CalendlyTimeSlot {
  start_time: string;
  end_time: string;
}

export interface CalendlyAvailabilityResponse {
  collection: Array<{
    uri: string;
    status: string;
    slots: CalendlyTimeSlot[];
  }>;
  pagination: {
    count: number;
    next_page: string | null;
    previous_page: string | null;
    next_page_token: string | null;
    previous_page_token: string | null;
  };
}



interface GetAvailabilityParams {
  eventTypeId: string;
  date: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
}

export async function getAvailability({
  eventTypeId,
  date,
  timezone = 'Asia/Calcutta',
  startTime,
  endTime
}: GetAvailabilityParams): Promise<TimeSlot[]> {
  try {
    const client = getCalendlyClient();

    const [year, month, day] = date.split('-').map(Number);

    // Parse start and end times (default to full day)
    const [startHour = 0, startMinute = 0] = (startTime || '').split(':').map(Number);
    const [endHour = 23, endMinute = 59] = (endTime || '23:59').split(':').map(Number);

    // Create dates in the specified timezone
    const localStartDate = new Date(year, month - 1, day, startHour, startMinute);
    const localEndDate = new Date(year, month - 1, day, endHour, endMinute, 59);

    // Convert local times to UTC for the API
    const startUTC = zonedTimeToUtc(localStartDate, timezone);
    const endUTC = zonedTimeToUtc(localEndDate, timezone);

    const response = await client.get('/event_type_available_times', {
      params: {
        event_type: `https://api.calendly.com/event_types/${eventTypeId}`,
        start_time: startUTC.toISOString(),
        end_time: endUTC.toISOString(),
      },
    });

    const slots = response.data.collection || [];

    return slots.map((slot: any) => {
      const start = new Date(slot.start_time);
      const end = slot.end_time ? new Date(slot.end_time) : new Date(start.getTime() + 30 * 60000);

      return {
        start: start.toISOString(),
        end: end.toISOString(),
        schedulingUrl: slot.scheduling_url,
        available: slot.status === 'available',
      };
    });

  } catch (err) {
    console.error('Calendly availability error:', err);
    return [];
  }
}

export async function createBooking(eventTypeId: string, data: {
  name: string;
  email: string;
  phone: string;
  startTime: string;
  timezone: string;
  notes?: string;
}) {
  try {
    const client = getCalendlyClient();

    const response = await client.post('/invitees', {
      event_type: `https://api.calendly.com/event_types/${eventTypeId}`,
      start_time: new Date(data.startTime).toISOString(),
      invitee: {
        name: data.name,
        email: data.email,
        timezone: data.timezone,
        text_reminder_number: data.phone
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw error;
  }
}







