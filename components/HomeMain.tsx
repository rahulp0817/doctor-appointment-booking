"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Calendar } from "./ui/calenderDate";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

interface FormErrors {
  reason?: string;
  appointmentType?: string;
  preferredDate?: string;
  selectedSlot?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
  color: string;
  booking_method?: "instant" | "request" | string;
  schedulingUrl: string;
  locations: any[];
  customQuestions: any[];
  slug: string;
  active: boolean;
  type: string;
}

export default function HomeMain() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    []
  );
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState<boolean>(true);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    reason: string;
    appointmentType: AppointmentType | null;
    preferredDate: string;
    preferredTime: string;
    selectedSlot: TimeSlot | null;
  }>({
    name: "",
    email: "",
    phone: "+91 ",
    reason: "",
    appointmentType: null,
    preferredDate: "",
    preferredTime: "",
    selectedSlot: null,
  });

  const [confirmation, setConfirmation] = useState<{
    confirmationNumber: string;
    name: string;
    email: string;
    phone: string;
    reason: string;
    appointmentType: AppointmentType | null;
    preferredDate: string;
    preferredTime: string;
    selectedSlot: TimeSlot | null;
    status: string;
    createdAt: string;
  } | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});

  //date fetch
  useEffect(() => {
    const dates: Date[] = [];
    const today = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    let currentDate = new Date(today);
    while (currentDate <= twoMonthsLater) {
      if (currentDate.getDay() === 1 || currentDate.getDay() === 3) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setAvailableDates(dates);
  }, []);

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    setFormData((prev) => ({
      ...prev,
      preferredDate: dateString,
    }));
  };

  // fetch
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        setIsLoadingEventTypes(true);
        setEventTypesError(null);

        const response = await fetch("/api/calendly/event-types");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch event types");
        }

        const transformedTypes: AppointmentType[] = data.collection.map(
          (eventType: any) => ({
            id: eventType.uri.split("/").pop() || "",
            name: eventType.name,
            duration: eventType.duration,
            description:
              eventType.description_plain ||
              eventType.description_html?.replace(/<[^>]*>?/gm, "") ||
              "No description available",
            color: eventType.color || "#3b82f6",
            schedulingUrl: eventType.scheduling_url,
            locations: eventType.locations || [],
            customQuestions: eventType.custom_questions || [],
            slug: eventType.slug,
            active: eventType.active,
            booking_method: eventType.booking_method || "request", // Default to 'request' if not provided
            type: eventType.type,
          })
        );

        setAppointmentTypes(transformedTypes);
      } catch (error) {
        console.error("Error fetching event types:", error);
        setEventTypesError(
          "Failed to load appointment types. Using default types."
        );
      } finally {
        setIsLoadingEventTypes(false);
      }
    };

    fetchEventTypes();
  }, []);

  // Fetch available slots when appointment type or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.appointmentType && formData.preferredDate) {
        setIsFetchingSlots(true);
        try {
          const response = await fetch("/api/calendly/slots", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventTypeId: formData.appointmentType.id,
              date: formData.preferredDate,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              startTime: "09:00", // optional
              endTime: "18:00", // optional
            }),
          });

          const data = await response.json();

          if (data.success) {
            setAvailableSlots(data.data.availableSlots || []);
          } else {
            console.error("Error fetching slots:", data.error);
            setAvailableSlots([]);
          }
        } catch (error) {
          console.error("Error fetching slots:", error);
          setAvailableSlots([]);
        } finally {
          setIsFetchingSlots(false);
        }
      }
    };

    fetchSlots();
  }, [formData.appointmentType, formData.preferredDate]);

  const validateStep = (currentStep: number) => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.reason.trim())
        newErrors.reason = "Please describe your reason for visit";
      if (!formData.appointmentType)
        newErrors.appointmentType = "Please select an appointment type";
    }

    if (currentStep === 2) {
      if (!formData.preferredDate)
        newErrors.preferredDate = "Please select a preferred date";
      if (!formData.selectedSlot)
        newErrors.selectedSlot = "Please select a time slot";
    }

    if (currentStep === 3) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email format";

      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone is required";
      } else if (phoneDigits.length !== 12) {
        // +91 plus 10 digits
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 1) {
      setLoading(true);
      await fetchAvailableSlots();
      setLoading(false);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!formData.appointmentType || !formData.preferredDate) return;

    setIsFetchingSlots(true);
    try {
      const response = await fetch("/api/calendly/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTypeId: formData.appointmentType.id,
          date: formData.preferredDate,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAvailableSlots(data.data.availableSlots || []);
      } else {
        console.error("Error fetching slots:", data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !formData.appointmentType || !formData.selectedSlot)
      return;

    setLoading(true);

    try {
      const response = await fetch("/api/calendly/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTypeId: formData.appointmentType.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          startTime: formData.selectedSlot.start,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const conf = {
          confirmationNumber:
            data.data.confirmationNumber || `APT-${Date.now()}`,
          ...formData,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        };
        setConfirmation(conf);
        setStep(4);
      } else {
        console.error("Booking failed:", data.error);
        alert(`Booking failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert(
        "An error occurred while processing your booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return "--:--";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "--:--"
        : date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
    } catch (e) {
      return "--:--";
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "--"
        : date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
    } catch (e) {
      return "--";
    }
  };

  //////
  // Add this function in HomeMain.tsx
  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/calendly/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching availability:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadAvailability = async () => {
      const availabilityData = await fetchAvailability();
      if (availabilityData?.collection?.length > 0) {
        const dates = availabilityData.collection.flatMap((schedule: any) => {
          if (schedule.rules?.length > 0) {
            return schedule.rules
              .filter(
                (rule: any) =>
                  rule.type === "wday" && [1, 3].includes(rule.wday)
              )
              .map((rule: any) => {
                const date = new Date();
                date.setDate(
                  date.getDate() + ((7 - date.getDay() + rule.wday) % 7)
                );
                return date;
              });
          }
          return [];
        });
        setAvailableDates(dates);
      }
    };

    loadAvailability();
  }, []);

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    // FIX: Create date in local timezone, not UTC
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  return (
    <div className="min-h-screen transition-colors mt-20 duration-300">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 mb-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Book Doctor Appointment
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Professional Calendly-Integrated Booking Platform
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-8 gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          {/* Step 1: Appointment Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Tell us about your visit
              </h2>
              {isLoadingEventTypes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div
                      key={index}
                      className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                    >
                      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 m-4 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 m-4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : eventTypesError ? (
                <div className="text-center py-8 text-red-500">
                  <p>{eventTypesError}</p>
                  {/* fallback buttons */}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-pointer">
                  {appointmentTypes.map((type) => {
                    const isSelected = formData.appointmentType?.id === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() =>
                          setFormData({ ...formData, appointmentType: type })
                        }
                        className={`p-4 cursor-pointer border-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {type.name}
                          </h3>
                          <Clock className="w-5 h-5 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {type.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {type.duration} minutes
                          </span>
                          {type.booking_method === "instant" && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Instant Booking
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div> */}

                <div>
                  <Calendar
                    selectedDate={
                      formData.preferredDate
                        ? parseDate(formData.preferredDate)
                        : undefined
                    }
                    onDateSelect={handleDateSelect}
                    availableDates={availableDates}
                    style={{ height: "65%" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>

                  <Select
                    value={formData.preferredTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, preferredTime: value })
                    }
                  >
                    <SelectTrigger
                      style={{ height: "65%" }}
                      className="w-full px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white flex items-center justify-between"
                    >
                      <SelectValue placeholder="Select Availability" />
                    </SelectTrigger>

                    <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-gray-50 rounded-lg shadow-lg mt-1">
                      <SelectItem
                        value="any-time"
                        className="hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Anytime
                      </SelectItem>
                      <SelectItem
                        value="morning"
                        className="hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Morning (9 AM - 12 PM)
                      </SelectItem>
                      <SelectItem
                        value="afternoon"
                        className="hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Afternoon (12 PM - 5 PM)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Please describe your symptoms or reason for the appointment..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white min-h-[100px]"
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Find Available Slots"}
              </button>
            </div>
          )}

          {/* Step 2: Slot Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Available Time Slots
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-500 px-3 py-2 flex items-center gap-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Selected:</strong> {formData.appointmentType?.name} (
                  {formData.appointmentType?.duration} min) on{" "}
                  {formatDate(formData.preferredDate)}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Recommended slots for you:
                </h3>
                {isFetchingSlots ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  availableSlots.map((slot, index) => (
                    <button
                      key={`${slot.start}-${index}`}
                      onClick={() =>
                        setFormData({ ...formData, selectedSlot: slot })
                      }
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        formData.selectedSlot?.start === slot.start
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </span>
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      {slot.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {slot.reason}
                        </p>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No available slots
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Please try another date or time.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.selectedSlot}
                className="w-full bg-blue-500 hover:bg-blue-600 cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Continue to Confirmation
              </button>
            </div>
          )}

          {/* Step 3: Patient Information */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Information
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-500 px-3 py-2 flex items-center gap-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Appointment:</strong> {formData.appointmentType?.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Date & Time:</strong>{" "}
                  {formData.selectedSlot?.start ? (
                    <>
                      {formatDate(formData.selectedSlot.start)} at{" "}
                      {formatTime(formData.selectedSlot.start)}
                    </>
                  ) : (
                    "--"
                  )}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Duration:</strong>{" "}
                  {formData.appointmentType?.duration} minutes
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4" />
                    <span>
                      Full Name <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    <span>
                      Email Address <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    <span>
                      Phone Number <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      let input = e.target.value;

                      // Always maintain +91 prefix
                      if (!input.startsWith("+91 ")) {
                        input = "+91 " + input.replace(/\D/g, "");
                      }

                      // Limit to 10 digits after +91
                      const digits = input.replace(/\D/g, "");
                      if (digits.length <= 12) {
                        // +91 plus 10 digits
                        // Format as +91 XXXXXXXXXX
                        const formatted =
                          digits.length <= 2
                            ? `+${digits}`
                            : `+${digits.slice(0, 2)} ${digits.slice(2, 12)}`;
                        setFormData({ ...formData, phone: formatted });
                      }
                    }}
                    placeholder="+91 9876543210"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />

                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Please review all information carefully before confirming.
                  You'll receive a confirmation email and SMS reminder 24 hours
                  before your appointment.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && confirmation && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Appointment Confirmed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your appointment has been successfully scheduled
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-3 text-left max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Confirmation #
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {confirmation.confirmationNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Patient
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {confirmation.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Appointment Type
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {confirmation.appointmentType?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Date
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(confirmation.selectedSlot?.start)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Time
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(confirmation.selectedSlot?.start)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Duration
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {confirmation.appointmentType?.duration} minutes
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📧 Confirmation email sent to{" "}
                  <strong>{confirmation.email}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📱 SMS reminder will be sent to{" "}
                  <strong>{confirmation.phone}</strong>
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Book Another Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
