export interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
  color: string;
  schedulingUrl?: string;
  locations?: CalendlyLocation[];
  customQuestions?: CustomQuestion[];
  slug?: string;
  active?: boolean;
  booking_method?: string;
  type?: string;
}

export interface CalendlyLocation {
  kind: string;
  [key: string]: any;
}

export interface CustomQuestion {
  name: string;
  required: boolean;
  type: string;
  [key: string]: any;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export interface BookingData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  appointmentType: AppointmentType;
  selectedSlot: TimeSlot;
  preferredDate?: string;
}

export interface CalendlyEvent {
  uri: string;
  name: string;
  start_time: string;
  end_time: string;
}

export const APPOINTMENT_TYPES: AppointmentType[] = [
  {
    id: 'general',
    name: 'General Consultation',
    duration: 30,
    description: 'Regular check-up and consultation',
    color: 'bg-blue-500',
  },
  {
    id: 'followup',
    name: 'Follow-up',
    duration: 15,
    description: 'Follow-up visit for existing condition',
    color: 'bg-green-500',
  },
  {
    id: 'physical',
    name: 'Physical Exam',
    duration: 45,
    description: 'Comprehensive physical examination',
    color: 'bg-purple-500',
  },
  {
    id: 'specialist',
    name: 'Specialist Consultation',
    duration: 60,
    description: 'Consultation with specialist doctor',
    color: 'bg-red-500',
  },
];