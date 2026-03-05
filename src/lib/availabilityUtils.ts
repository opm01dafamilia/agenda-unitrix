/**
 * Shared availability logic for Agenda and PublicBooking.
 * Generates 15-min slots filtered by work hours, blocks, and existing appointments.
 */

export interface WorkHourEntry {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface TimeBlockEntry {
  block_start: string;
  block_end: string;
}

export interface AppointmentEntry {
  start_time: string;
  end_time: string | null;
  calculated_duration_minutes: number | null;
  status: string;
}

/** Generate all 15-min slot labels from 06:00 to 23:45 */
export const generateAllSlots = (stepMinutes = 15): string[] => {
  const slots: string[] = [];
  for (let m = 6 * 60; m < 24 * 60; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const mi = m % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${mi.toString().padStart(2, "0")}`);
  }
  return slots;
};

/** Convert "HH:MM" to minutes since midnight */
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Returns available slots for a given date, professional, and service duration.
 * @param date - The date in question (JS Date)
 * @param workHours - All work hour entries for the professional
 * @param blocks - All time blocks for the professional
 * @param appointments - All non-cancelled appointments for the business on that date
 * @param durationMinutes - Duration of the service to book
 * @param professionalId - Optional: filter appointments by professional
 * @param stepMinutes - Slot interval (default 15)
 */
export function getAvailableSlots(
  date: Date,
  workHours: WorkHourEntry[],
  blocks: TimeBlockEntry[],
  appointments: AppointmentEntry[],
  durationMinutes: number = 30,
  professionalId?: string,
  stepMinutes: number = 15
): { slot: string; available: boolean }[] {
  const dayOfWeek = date.getDay(); // 0=Sun
  const dateStr = formatDateLocal(date);

  // 1. Get active work hour intervals for this weekday
  const dayWorkHours = workHours.filter(
    wh => wh.weekday === dayOfWeek && wh.is_active
  );

  // If no work hours defined, no slots available
  if (dayWorkHours.length === 0) return [];

  // Build set of minutes that are "working"
  const workingMinutes = new Set<number>();
  for (const wh of dayWorkHours) {
    const start = toMin(wh.start_time.slice(0, 5));
    const end = toMin(wh.end_time.slice(0, 5));
    for (let m = start; m < end; m++) {
      workingMinutes.add(m);
    }
  }

  // 2. Build blocked minutes set from blocks that overlap this date
  const blockedMinutes = new Set<number>();
  for (const b of blocks) {
    const bStart = new Date(b.block_start);
    const bEnd = new Date(b.block_end);
    const bDateStr = formatDateLocal(bStart);
    if (bDateStr !== dateStr) continue;
    const startMin = bStart.getHours() * 60 + bStart.getMinutes();
    const endMin = bEnd.getHours() * 60 + bEnd.getMinutes();
    for (let m = startMin; m < endMin; m++) {
      blockedMinutes.add(m);
    }
  }

  // 3. Build occupied minutes from appointments
  const occupiedMinutes = new Set<number>();
  for (const a of appointments) {
    if (a.status === "cancelled") continue;
    if (!a.start_time) continue;
    const startMin = toMin(a.start_time.slice(0, 5));
    const dur = a.calculated_duration_minutes || 30;
    for (let m = startMin; m < startMin + dur; m++) {
      occupiedMinutes.add(m);
    }
  }

  // 4. Generate slots and check availability
  const allSlots = generateAllSlots(stepMinutes);
  const result: { slot: string; available: boolean }[] = [];

  for (const slot of allSlots) {
    const slotStart = toMin(slot);
    const slotEnd = slotStart + durationMinutes;

    // Check every minute of the service duration
    let available = true;
    for (let m = slotStart; m < slotEnd; m++) {
      if (!workingMinutes.has(m) || blockedMinutes.has(m) || occupiedMinutes.has(m)) {
        available = false;
        break;
      }
    }

    // Only show slots that start within working hours
    if (workingMinutes.has(slotStart)) {
      result.push({ slot, available });
    }
  }

  return result;
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
