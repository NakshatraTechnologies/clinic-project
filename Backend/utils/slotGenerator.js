/**
 * Slot Generator Utility
 *
 * Generates all possible appointment slots for a doctor on a given date
 * based on their availability schedule and slot duration.
 *
 * Example:
 *   Doctor available 10:00-14:00, slotDuration = 15 min
 *   Generated slots: 10:00-10:15, 10:15-10:30, ..., 13:45-14:00
 */

/**
 * Convert "HH:mm" string to total minutes from midnight
 * @param {string} timeStr - Time in "HH:mm" format
 * @returns {number} Total minutes
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert total minutes to "HH:mm" string
 * @param {number} minutes - Total minutes from midnight
 * @returns {string} Time in "HH:mm" format
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Get the day name from a Date object
 * @param {Date} date - Date object
 * @returns {string} Lowercase day name (e.g., "monday")
 */
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Generate all possible time slots for a given day's availability
 *
 * @param {Array} timeSlots - Array of { startTime: "HH:mm", endTime: "HH:mm" }
 * @param {number} slotDuration - Duration of each slot in minutes
 * @param {number} [bufferTime=0] - Buffer time between consecutive slots in minutes
 * @returns {Array} Array of { startTime: "HH:mm", endTime: "HH:mm" }
 */
const generateTimeSlots = (timeSlots, slotDuration, bufferTime = 0) => {
  const allSlots = [];

  for (const slot of timeSlots) {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);

    // Generate slots within this time range, including buffer between appointments
    const step = slotDuration + bufferTime;
    for (let current = startMinutes; current + slotDuration <= endMinutes; current += step) {
      allSlots.push({
        startTime: minutesToTime(current),
        endTime: minutesToTime(current + slotDuration),
      });
    }
  }

  return allSlots;
};

/**
 * Generate available slots for a doctor on a specific date.
 * Filters out already-booked slots.
 *
 * @param {Object} doctorProfile - DoctorProfile document
 * @param {Date} date - The target date
 * @param {Array} bookedAppointments - Array of existing (non-cancelled) appointments for that date
 * @returns {Object} { allSlots, availableSlots, bookedSlots }
 */
const getAvailableSlots = (doctorProfile, date, bookedAppointments = []) => {
  const dayName = getDayName(date);

  // Find availability for this day
  const dayAvailability = doctorProfile.availability.find(
    (a) => a.day === dayName
  );

  // If no availability set for this day OR marked unavailable
  if (!dayAvailability || !dayAvailability.isAvailable || !dayAvailability.slots.length) {
    return {
      isAvailable: false,
      dayName,
      allSlots: [],
      availableSlots: [],
      bookedSlots: [],
    };
  }

  // Generate all possible slots (with buffer time between them)
  const allSlots = generateTimeSlots(
    dayAvailability.slots,
    doctorProfile.slotDuration,
    doctorProfile.bufferTime || 0
  );

  // Get booked start times (only non-cancelled appointments)
  const bookedStartTimes = new Set(
    bookedAppointments
      .filter((apt) => apt.status !== 'cancelled')
      .map((apt) => apt.startTime)
  );

  // Filter: check if the slot is in the past (for today's date)
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Split into available and booked
  const availableSlots = [];
  const bookedSlots = [];

  for (const slot of allSlots) {
    const slotMinutes = timeToMinutes(slot.startTime);

    // Skip past slots if today
    if (isToday && slotMinutes <= currentMinutes) {
      bookedSlots.push({ ...slot, status: 'past' });
      continue;
    }

    if (bookedStartTimes.has(slot.startTime)) {
      bookedSlots.push({ ...slot, status: 'booked' });
    } else {
      availableSlots.push({ ...slot, status: 'available' });
    }
  }

  return {
    isAvailable: true,
    dayName,
    slotDuration: doctorProfile.slotDuration,
    allSlots,
    availableSlots,
    bookedSlots,
    totalSlots: allSlots.length,
    availableCount: availableSlots.length,
    bookedCount: bookedSlots.length,
  };
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  getDayName,
  generateTimeSlots,
  getAvailableSlots,
};
