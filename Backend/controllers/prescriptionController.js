const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const { generatePrescriptionPDF } = require('../utils/prescriptionPDF');
const path = require('path');
const fs = require('fs');

// Ensure prescriptions directory exists
const prescriptionsDir = path.join(__dirname, '..', 'uploads', 'prescriptions');
if (!fs.existsSync(prescriptionsDir)) {
  fs.mkdirSync(prescriptionsDir, { recursive: true });
}

// ==========================================
// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
// ==========================================
const createPrescription = async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      notes,
      followUpDate,
    } = req.body;

    if (!appointmentId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and Patient ID are required',
      });
    }

    if (!medicines || !medicines.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine is required',
      });
    }

    // Verify appointment exists and belongs to this doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized — this appointment is not yours',
      });
    }

    // Check if a FINAL prescription already exists for this appointment
    const existingFinal = await Prescription.findOne({ appointmentId, status: 'FINAL' });
    if (existingFinal) {
      return res.status(400).json({
        success: false,
        message: 'A finalized prescription already exists for this appointment.',
        prescriptionId: existingFinal._id,
      });
    }

    // If a DRAFT exists, update it instead of creating a new one
    const existingDraft = await Prescription.findOne({ appointmentId, status: 'DRAFT' });
    if (existingDraft) {
      existingDraft.diagnosis = diagnosis || existingDraft.diagnosis;
      existingDraft.symptoms = symptoms || existingDraft.symptoms;
      existingDraft.medicines = medicines;
      existingDraft.labTests = labTests || existingDraft.labTests;
      existingDraft.notes = notes !== undefined ? notes : existingDraft.notes;
      existingDraft.followUpDate = followUpDate !== undefined ? followUpDate : existingDraft.followUpDate;
      await existingDraft.save();
      return res.status(200).json({
        success: true,
        message: 'Draft prescription updated',
        prescription: existingDraft,
      });
    }

    // Create prescription as DRAFT
    const prescription = await Prescription.create({
      appointmentId,
      doctorId: req.user._id,
      clinicId: req.user.clinicId || appointment.clinicId || null,
      patientId,
      diagnosis: diagnosis || '',
      symptoms: symptoms || [],
      medicines,
      labTests: labTests || [],
      notes: notes || '',
      followUpDate: followUpDate || null,
      status: 'DRAFT',
    });

    // Generate PDF
    try {
      const doctor = await User.findById(req.user._id);
      const patient = await User.findById(patientId);
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });

      const pdfBuffer = await generatePrescriptionPDF({
        prescription,
        doctor,
        patient,
        doctorProfile,
      });

      // Save PDF file
      const fileName = `rx_${prescription._id}.pdf`;
      const filePath = path.join(prescriptionsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // Update prescription with PDF URL
      prescription.pdfUrl = `/uploads/prescriptions/${fileName}`;
      await prescription.save();
    } catch (pdfError) {
      console.error('PDF Generation Error (non-fatal):', pdfError.message);
      // Prescription is still created, just without PDF
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription,
    });
  } catch (error) {
    console.error('Create Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Update a prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
// ==========================================
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, symptoms, medicines, labTests, notes, followUpDate } =
      req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    // Only the prescribing doctor can update
    if (prescription.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Block updates on FINAL prescriptions
    if (prescription.status === 'FINAL') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a finalized prescription',
      });
    }

    // Update fields
    if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
    if (symptoms) prescription.symptoms = symptoms;
    if (medicines) prescription.medicines = medicines;
    if (labTests) prescription.labTests = labTests;
    if (notes !== undefined) prescription.notes = notes;
    if (followUpDate !== undefined) prescription.followUpDate = followUpDate;

    await prescription.save();

    // Regenerate PDF
    try {
      const doctor = await User.findById(req.user._id);
      const patient = await User.findById(prescription.patientId);
      const doctorProfile = await DoctorProfile.findOne({
        userId: req.user._id,
      });

      const pdfBuffer = await generatePrescriptionPDF({
        prescription,
        doctor,
        patient,
        doctorProfile,
      });

      const fileName = `rx_${prescription._id}.pdf`;
      const filePath = path.join(prescriptionsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      prescription.pdfUrl = `/uploads/prescriptions/${fileName}`;
      await prescription.save();
    } catch (pdfError) {
      console.error('PDF Regeneration Error:', pdfError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      prescription,
    });
  } catch (error) {
    console.error('Update Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Doctor, Patient)
// ==========================================
const getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate('doctorId', 'name phone email')
      .populate('patientId', 'name phone email gender dateOfBirth')
      .populate('appointmentId', 'date startTime endTime');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    // Authorization: only doctor who wrote it or the patient
    const isDoctor =
      prescription.doctorId._id.toString() === req.user._id.toString();
    const isPatient =
      prescription.patientId._id.toString() === req.user._id.toString();

    if (!isDoctor && !isPatient && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prescription',
      });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error('Get Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescription',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get prescriptions by appointment
// @route   GET /api/prescriptions/appointment/:appointmentId
// @access  Private
// ==========================================
const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({ appointmentId })
      .populate('doctorId', 'name phone email')
      .populate('patientId', 'name phone email gender dateOfBirth');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'No prescription found for this appointment',
      });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error('Get Prescription By Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescription',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get all prescriptions for a patient (patient's history)
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor, Patient)
// ==========================================
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name phone')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments({ patientId });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      prescriptions,
    });
  } catch (error) {
    console.error('Get Patient Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Download prescription PDF
// @route   GET /api/prescriptions/:id/pdf
// @access  Private (Doctor, Patient)
// ==========================================
const downloadPrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    // Check authorization
    const isDoctor =
      prescription.doctorId.toString() === req.user._id.toString();
    const isPatient =
      prescription.patientId.toString() === req.user._id.toString();

    if (!isDoctor && !isPatient && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // If PDF exists on disk, send it
    const fileName = `rx_${prescription._id}.pdf`;
    const filePath = path.join(prescriptionsDir, fileName);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      return fs.createReadStream(filePath).pipe(res);
    }

    // If no saved PDF, regenerate on-the-fly
    const doctor = await User.findById(prescription.doctorId);
    const patient = await User.findById(prescription.patientId);
    const doctorProfile = await DoctorProfile.findOne({
      userId: prescription.doctorId,
    });

    const pdfBuffer = await generatePrescriptionPDF({
      prescription,
      doctor,
      patient,
      doctorProfile,
    });

    // Save for future use
    fs.writeFileSync(filePath, pdfBuffer);
    prescription.pdfUrl = `/uploads/prescriptions/${fileName}`;
    await prescription.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's all prescriptions
// @route   GET /api/prescriptions/doctor/all
// @access  Private (Doctor)
// ==========================================
const getDoctorPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let filter = { doctorId: req.user._id };

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name phone')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      prescriptions,
    });
  } catch (error) {
    console.error('Get Doctor Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Finalize a DRAFT prescription
// @route   PATCH /api/prescriptions/:id/finalize
// @access  Private (Doctor)
// ==========================================
const finalizePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    // Only the prescribing doctor can finalize
    if (prescription.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (prescription.status === 'FINAL') {
      return res.status(400).json({
        success: false,
        message: 'Prescription is already finalized',
      });
    }

    // Check if a FINAL already exists for this appointment (app-level guard)
    const existingFinal = await Prescription.findOne({
      appointmentId: prescription.appointmentId,
      status: 'FINAL',
      _id: { $ne: prescription._id },
    });
    if (existingFinal) {
      return res.status(400).json({
        success: false,
        message: 'A finalized prescription already exists for this appointment',
      });
    }

    // Mark as FINAL
    prescription.status = 'FINAL';
    await prescription.save();

    // Update appointment status to prescription_created
    const appointment = await Appointment.findById(prescription.appointmentId);
    if (appointment && !['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      appointment.status = 'prescription_created';
      appointment.auditLog.push({
        action: 'prescription_created',
        performedBy: req.user._id,
        timestamp: new Date(),
        details: 'Prescription finalized by doctor',
        oldValue: appointment.status,
        newValue: 'prescription_created',
      });
      await appointment.save();
    }

    // Generate PDF
    try {
      const doctor = await User.findById(req.user._id);
      const patient = await User.findById(prescription.patientId);
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });

      const pdfBuffer = await generatePrescriptionPDF({
        prescription,
        doctor,
        patient,
        doctorProfile,
      });

      const fileName = `rx_${prescription._id}.pdf`;
      const filePath = path.join(prescriptionsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      prescription.pdfUrl = `/uploads/prescriptions/${fileName}`;
      await prescription.save();
    } catch (pdfError) {
      console.error('PDF Generation Error (non-fatal):', pdfError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Prescription finalized successfully',
      prescription,
    });
  } catch (error) {
    console.error('Finalize Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize prescription',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get logged-in patient's own prescriptions
// @route   GET /api/prescriptions/me
// @access  Private (Patient)
// ==========================================
const getMyPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate('doctorId', 'name phone')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments({ patientId: req.user._id });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      prescriptions,
    });
  } catch (error) {
    console.error('Get My Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions',
      error: error.message,
    });
  }
};

module.exports = {
  createPrescription,
  updatePrescription,
  getPrescription,
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  downloadPrescriptionPDF,
  getDoctorPrescriptions,
  finalizePrescription,
  getMyPrescriptions,
};
