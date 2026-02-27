/**
 * Notification Service
 *
 * Abstraction layer for sending notifications.
 * Currently logs to console. Ready for SMS/WhatsApp/Email integration.
 *
 * Integration points (uncomment when ready):
 * - Twilio for SMS
 * - WhatsApp Business API
 * - Nodemailer/SendGrid for Email
 */

const sendBookingConfirmation = async (appointment, patient, doctor) => {
  const msg = `Appointment booked! Dr. ${doctor?.name || 'Doctor'} on ${new Date(appointment.date).toLocaleDateString('en-IN')} at ${appointment.startTime}.`;

  console.log(`📧 [NOTIFICATION] Booking Confirmation → ${patient?.name || 'Patient'} (${patient?.phone || 'N/A'})`);
  console.log(`   Message: ${msg}`);

  // TODO: Integrate with SMS/WhatsApp/Email
  // await sendSMS(patient.phone, msg);
  // await sendEmail(patient.email, 'Appointment Confirmed', msg);
  // await sendWhatsApp(patient.phone, msg);
};

const sendCancellationNotice = async (appointment, patient, doctor, cancelledBy) => {
  const msg = `Your appointment with Dr. ${doctor?.name || 'Doctor'} on ${new Date(appointment.date).toLocaleDateString('en-IN')} at ${appointment.startTime} has been cancelled.`;

  console.log(`📧 [NOTIFICATION] Cancellation → ${patient?.name || 'Patient'} (cancelled by: ${cancelledBy || 'user'})`);
  console.log(`   Message: ${msg}`);
};

const sendRescheduleNotice = async (appointment, patient, doctor, oldDate, oldTime) => {
  const msg = `Your appointment with Dr. ${doctor?.name || 'Doctor'} has been rescheduled from ${oldDate} ${oldTime} to ${new Date(appointment.date).toLocaleDateString('en-IN')} at ${appointment.startTime}.`;

  console.log(`📧 [NOTIFICATION] Reschedule → ${patient?.name || 'Patient'}`);
  console.log(`   Message: ${msg}`);
};

const sendStatusUpdate = async (appointment, patient, doctor, newStatus) => {
  const statusMessages = {
    confirmed: `Your appointment with Dr. ${doctor?.name || 'Doctor'} on ${new Date(appointment.date).toLocaleDateString('en-IN')} has been confirmed!`,
    completed: `Your visit with Dr. ${doctor?.name || 'Doctor'} has been completed. Thank you!`,
    'no-show': `You missed your appointment with Dr. ${doctor?.name || 'Doctor'}. Please reschedule.`,
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  console.log(`📧 [NOTIFICATION] Status Update (${newStatus}) → ${patient?.name || 'Patient'}`);
  console.log(`   Message: ${msg}`);
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotice,
  sendRescheduleNotice,
  sendStatusUpdate,
};
