const PDFDocument = require('pdfkit');

/**
 * Generate a professional prescription PDF
 *
 * @param {Object} data - Prescription data with populated doctor, patient, and medicines
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePrescriptionPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Prescription - ${data.patient.name}`,
          Author: `Dr. ${data.doctor.name}`,
          Creator: 'Nakshatra Clinic Management System',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 80; // Accounting for margins

      // ============ HEADER ============
      // Clinic/Doctor Name
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text(`Dr. ${data.doctor.name}`, { align: 'center' });

      // Specialization
      if (data.doctorProfile && data.doctorProfile.specialization) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#5d6d7e')
          .text(data.doctorProfile.specialization.join(', '), {
            align: 'center',
          });
      }

      // Qualifications
      if (
        data.doctorProfile &&
        data.doctorProfile.qualifications &&
        data.doctorProfile.qualifications.length
      ) {
        doc
          .fontSize(9)
          .fillColor('#7f8c8d')
          .text(data.doctorProfile.qualifications.join(' | '), {
            align: 'center',
          });
      }

      // Clinic info
      if (data.doctorProfile && data.doctorProfile.clinicName) {
        doc
          .fontSize(10)
          .fillColor('#5d6d7e')
          .text(data.doctorProfile.clinicName, { align: 'center' });
      }

      if (
        data.doctorProfile &&
        data.doctorProfile.clinicAddress &&
        data.doctorProfile.clinicAddress.city
      ) {
        const addr = data.doctorProfile.clinicAddress;
        const addressLine = [addr.street, addr.city, addr.state, addr.pincode]
          .filter(Boolean)
          .join(', ');
        doc.fontSize(9).fillColor('#7f8c8d').text(addressLine, { align: 'center' });
      }

      // Phone
      doc
        .fontSize(9)
        .fillColor('#7f8c8d')
        .text(`📞 ${data.doctor.phone}`, { align: 'center' });

      doc.moveDown(0.5);

      // ============ DIVIDER ============
      doc
        .strokeColor('#2980b9')
        .lineWidth(2)
        .moveTo(40, doc.y)
        .lineTo(40 + pageWidth, doc.y)
        .stroke();

      doc.moveDown(0.5);

      // ============ Rx SYMBOL ============
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#2980b9')
        .text('℞', 40, doc.y);

      // ============ PATIENT & DATE INFO ============
      const infoY = doc.y - 25;

      // Right side: Date + Prescription ID
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text(
          `Date: ${new Date(data.prescription.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`,
          300,
          infoY,
          { align: 'right' }
        );

      doc.moveDown(0.3);

      // Patient details - left side
      const patientY = doc.y + 5;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(`Patient: ${data.patient.name}`, 40, patientY);

      const detailParts = [];
      if (data.patient.gender)
        detailParts.push(
          data.patient.gender.charAt(0).toUpperCase() +
            data.patient.gender.slice(1)
        );
      if (data.patient.dateOfBirth) {
        const age = Math.floor(
          (new Date() - new Date(data.patient.dateOfBirth)) / 31557600000
        );
        detailParts.push(`${age} yrs`);
      }
      if (data.patient.phone) detailParts.push(`Ph: ${data.patient.phone}`);

      if (detailParts.length) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#5d6d7e')
          .text(detailParts.join('  |  '), 40);
      }

      doc.moveDown(0.7);

      // ============ DIAGNOSIS ============
      if (data.prescription.diagnosis) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('Diagnosis:', 40);
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#2c3e50')
          .text(data.prescription.diagnosis, 40);
        doc.moveDown(0.4);
      }

      // ============ SYMPTOMS ============
      if (
        data.prescription.symptoms &&
        data.prescription.symptoms.length > 0
      ) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('Symptoms:', 40);
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#2c3e50')
          .text(data.prescription.symptoms.join(', '), 40);
        doc.moveDown(0.4);
      }

      // ============ MEDICINES TABLE ============
      if (
        data.prescription.medicines &&
        data.prescription.medicines.length > 0
      ) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('Medicines:', 40);

        doc.moveDown(0.3);

        // Table header
        const tableTop = doc.y;
        const col1 = 40; // #
        const col2 = 60; // Medicine
        const col3 = 220; // Dosage
        const col4 = 300; // Frequency
        const col5 = 390; // Duration
        const col6 = 460; // Instructions

        // Header background
        doc
          .rect(40, tableTop - 3, pageWidth, 18)
          .fillColor('#eaf2f8')
          .fill();

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1a5276');

        doc.text('#', col1, tableTop, { width: 20 });
        doc.text('Medicine', col2, tableTop, { width: 155 });
        doc.text('Dosage', col3, tableTop, { width: 75 });
        doc.text('Frequency', col4, tableTop, { width: 85 });
        doc.text('Duration', col5, tableTop, { width: 65 });
        doc.text('Instructions', col6, tableTop, { width: 90 });

        doc.moveDown(0.5);

        // Medicine rows
        data.prescription.medicines.forEach((med, index) => {
          const y = doc.y + 2;

          // Alternate row background
          if (index % 2 === 1) {
            doc
              .rect(40, y - 3, pageWidth, 16)
              .fillColor('#f8f9fa')
              .fill();
          }

          doc.fontSize(9).font('Helvetica').fillColor('#2c3e50');

          doc.text(`${index + 1}.`, col1, y, { width: 20 });
          doc.text(med.name, col2, y, { width: 155 });
          doc.text(med.dosage || '-', col3, y, { width: 75 });
          doc.text(med.frequency || '-', col4, y, { width: 85 });
          doc.text(med.duration || '-', col5, y, { width: 65 });
          doc.text(med.instructions || '-', col6, y, { width: 90 });

          doc.moveDown(0.4);
        });

        doc.moveDown(0.3);
      }

      // ============ LAB TESTS ============
      if (
        data.prescription.labTests &&
        data.prescription.labTests.length > 0
      ) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('Recommended Lab Tests:', 40);

        data.prescription.labTests.forEach((test, i) => {
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#2c3e50')
            .text(`  ${i + 1}. ${test}`, 40);
        });

        doc.moveDown(0.4);
      }

      // ============ NOTES ============
      if (data.prescription.notes) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('Notes:', 40);
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#2c3e50')
          .text(data.prescription.notes, 40);
        doc.moveDown(0.4);
      }

      // ============ FOLLOW-UP ============
      if (data.prescription.followUpDate) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#e74c3c')
          .text(
            `📅 Follow-up: ${new Date(
              data.prescription.followUpDate
            ).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}`,
            40
          );
        doc.moveDown(0.4);
      }

      // ============ SIGNATURE ============
      doc.moveDown(2);

      // Signature line
      const sigX = pageWidth - 100;
      doc
        .strokeColor('#bdc3c7')
        .lineWidth(1)
        .moveTo(sigX, doc.y)
        .lineTo(sigX + 140, doc.y)
        .stroke();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(`Dr. ${data.doctor.name}`, sigX, doc.y + 5, {
          width: 140,
          align: 'center',
        });

      if (
        data.doctorProfile &&
        data.doctorProfile.licenseNumber
      ) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#7f8c8d')
          .text(`Reg. No: ${data.doctorProfile.licenseNumber}`, sigX, doc.y, {
            width: 140,
            align: 'center',
          });
      }

      // ============ FOOTER ============
      const footerY = doc.page.height - 60;
      doc
        .strokeColor('#bdc3c7')
        .lineWidth(0.5)
        .moveTo(40, footerY)
        .lineTo(40 + pageWidth, footerY)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#95a5a6')
        .text(
          'This is a computer-generated prescription from Nakshatra Clinic Management System.',
          40,
          footerY + 8,
          { align: 'center', width: pageWidth }
        );
      doc
        .fontSize(7)
        .text(
          `Generated on: ${new Date().toLocaleString('en-IN')}`,
          40,
          footerY + 20,
          { align: 'center', width: pageWidth }
        );

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePrescriptionPDF };
