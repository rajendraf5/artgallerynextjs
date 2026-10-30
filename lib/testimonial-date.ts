// Testimonial times are wall-clock times entered in the admin. They are stored without a time zone,
// so they are always read and shown in UTC to come back exactly as entered.

const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Validates a datetime-local value such as "2024-08-23T12:25".
export function isValidTestimonialDateTime(value: string): boolean {
  if (!localDateTime.test(value)) return false;
  const date = new Date(`${value}:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// "2024-08-23T12:25:00Z" -> "2024-08-23T12:25", the value a datetime-local input expects.
export function toDateTimeInput(value?: string): string {
  return value?.slice(0, 16) ?? "";
}

// "2024-08-23T12:25:00Z" -> { date: "Aug 23, 2024", time: "12.25 PM" }.
export function formatTestimonialDateTime(value?: string): { date: string; time: string } | null {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const options = { timeZone: "UTC" } as const;
  return {
    date: date.toLocaleDateString("en-US", { ...options, month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { ...options, hour: "2-digit", minute: "2-digit", hour12: true }).replace(":", "."),
  };
}
