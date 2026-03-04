import { createConnection } from '../../../../config/database.js';
import { decryptData } from '../../../../services/encryptionService.js';

/**
 * Get detailed information for a participant (applicant) in an auction/raffle
 * Returns personal info, spouse, business, other information, and documents
 * 
 * @route GET /api/stalls/participants/:applicantId/detail
 */
export const getParticipantDetail = async (req, res) => {
  let connection;
  try {
    const { applicantId } = req.params;

    console.log('📋 Getting participant detail for applicant:', applicantId);

    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      });
    }

    connection = await createConnection();

    // 1. Get basic applicant info
    const [applicantRows] = await connection.execute(
      `SELECT 
        applicant_id,
        applicant_full_name,
        applicant_contact_number,
        applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,
        status,
        created_at
      FROM applicant 
      WHERE applicant_id = ?`,
      [applicantId]
    );

    if (!applicantRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    const applicant = applicantRows[0];

    // Decrypt basic applicant info
    const personalInfo = {
      applicantId: applicant.applicant_id,
      fullName: decryptData(applicant.applicant_full_name) || 'Unknown',
      contactNumber: decryptData(applicant.applicant_contact_number) || 'N/A',
      address: decryptData(applicant.applicant_address) || 'N/A',
      birthdate: applicant.applicant_birthdate,
      civilStatus: applicant.applicant_civil_status || 'N/A',
      educationalAttainment: applicant.applicant_educational_attainment || 'N/A',
      status: applicant.status,
      createdAt: applicant.created_at
    };

    // 2. Get email from multiple sources
    let email = 'N/A';
    
    // Try credential.username first
    const [credentialRows] = await connection.execute(
      `SELECT username FROM credential WHERE applicant_id = ? LIMIT 1`,
      [applicantId]
    );
    if (credentialRows.length > 0 && credentialRows[0].username && credentialRows[0].username.includes('@')) {
      email = credentialRows[0].username;
    }

    // Try other_information.email_address
    if (email === 'N/A') {
      const [otherInfoEmail] = await connection.execute(
        `SELECT email_address FROM other_information WHERE applicant_id = ? LIMIT 1`,
        [applicantId]
      );
      if (otherInfoEmail.length > 0 && otherInfoEmail[0].email_address) {
        email = decryptData(otherInfoEmail[0].email_address) || 'N/A';
      }
    }

    // Try stallholder.email
    if (email === 'N/A') {
      const [shEmail] = await connection.execute(
        `SELECT email FROM stallholder WHERE applicant_id = ? LIMIT 1`,
        [applicantId]
      );
      if (shEmail.length > 0 && shEmail[0].email) {
        email = decryptData(shEmail[0].email) || 'N/A';
      }
    }

    personalInfo.email = email;

    // 3. Get additional info using stored procedure (spouse, business, other_info)
    const [additionalInfo] = await connection.execute(
      `CALL getApplicantAdditionalInfo(?)`,
      [applicantId]
    );

    let spouseInfo = null;
    let businessInfo = null;
    let otherInfo = null;

    if (additionalInfo[0] && additionalInfo[0].length > 0) {
      const info = additionalInfo[0][0];

      // Spouse information
      if (info.spouse_full_name) {
        spouseInfo = {
          fullName: decryptData(info.spouse_full_name) || 'N/A',
          birthdate: info.spouse_birthdate || null,
          educationalAttainment: info.spouse_educational_attainment || 'N/A',
          contactNumber: decryptData(info.spouse_contact_number) || 'N/A',
          occupation: decryptData(info.spouse_occupation) || 'N/A'
        };
      }

      // Business information
      if (info.nature_of_business || info.capitalization || info.source_of_capital) {
        businessInfo = {
          natureOfBusiness: info.nature_of_business || 'N/A',
          capitalization: info.capitalization ? parseFloat(info.capitalization) : null,
          sourceOfCapital: info.source_of_capital || 'N/A',
          previousExperience: info.previous_business_experience || 'N/A',
          relativeStallOwner: info.relative_stall_owner || 'N/A'
        };
      }

      // Other information (documents/files)
      if (info.signature_of_applicant || info.house_sketch_location || info.valid_id || info.email_address) {
        otherInfo = {
          signature: info.signature_of_applicant || null,
          houseSketch: info.house_sketch_location || null,
          validId: info.valid_id || null,
          emailAddress: info.email_address ? (decryptData(info.email_address) || 'N/A') : 'N/A'
        };

        // If we still don't have email, use from other_information
        if (personalInfo.email === 'N/A' && otherInfo.emailAddress !== 'N/A') {
          personalInfo.email = otherInfo.emailAddress;
        }
      }
    }

    // 4. Get uploaded documents from applicant_documents table
    let documents = [];
    try {
      const [docRows] = await connection.execute(
        `SELECT 
          document_id,
          document_type,
          document_name,
          document_mime_type,
          file_path,
          verification_status,
          remarks,
          created_at
        FROM applicant_documents 
        WHERE applicant_id = ?
        ORDER BY created_at ASC`,
        [applicantId]
      );
      documents = docRows.map(doc => ({
        documentId: doc.document_id,
        type: doc.document_type,
        name: doc.document_name,
        mimeType: doc.document_mime_type,
        filePath: doc.file_path,
        verificationStatus: doc.verification_status,
        remarks: doc.remarks,
        createdAt: doc.created_at
      }));
    } catch (docErr) {
      console.error('Error fetching documents:', docErr);
    }

    // 5. Check if applicant is an active stallholder — if so, their documents are implicitly approved
    let isActiveStallholder = false;
    try {
      const [shCheck] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM stallholder WHERE applicant_id = ? AND status = 'active'`,
        [applicantId]
      );
      isActiveStallholder = (shCheck[0]?.cnt || 0) > 0;
    } catch (e) { /* ignore */ }

    // If active stallholder, mark all documents as Approved (manager already verified them)
    if (isActiveStallholder && documents.length > 0) {
      documents = documents.map(doc => ({
        ...doc,
        verificationStatus: 'Approved'
      }));
    }

    // 6. Deduplicate: if applicant_documents has entries for signature/valid_id/house_location,
    //    suppress the corresponding other_information fields to avoid showing duplicates
    if (otherInfo && documents.length > 0) {
      const docTypes = documents.map(d => (d.type || '').toLowerCase());
      if (docTypes.includes('signature')) otherInfo.signature = null;
      if (docTypes.includes('valid_id')) otherInfo.validId = null;
      if (docTypes.includes('house_location') || docTypes.includes('house_sketch')) otherInfo.houseSketch = null;

      // If all document fields are now null, remove otherInfo entirely
      if (!otherInfo.signature && !otherInfo.validId && !otherInfo.houseSketch) {
        otherInfo = null;
      }
    }

    // 7. Get stall count (active stallholder records)
    let stallCount = 0;
    let activeStalls = [];
    try {
      const [stallRows] = await connection.execute(
        `SELECT sh.stallholder_id, sh.stall_id, s.stall_number, b.branch_name
         FROM stallholder sh
         LEFT JOIN stall s ON sh.stall_id = s.stall_id
         LEFT JOIN branch b ON sh.branch_id = b.branch_id
         WHERE sh.applicant_id = ? AND sh.status = 'active'`,
        [applicantId]
      );
      stallCount = stallRows.length;
      activeStalls = stallRows.map(row => ({
        stallholderId: row.stallholder_id,
        stallId: row.stall_id,
        stallNumber: row.stall_number,
        branchName: row.branch_name
      }));
    } catch (stallErr) {
      console.error('Error fetching stall count:', stallErr);
    }

    await connection.end();

    return res.status(200).json({
      success: true,
      data: {
        personalInfo,
        spouseInfo,
        businessInfo,
        otherInfo,
        documents,
        stallCount,
        activeStalls
      }
    });

  } catch (error) {
    console.error('❌ Error getting participant detail:', error);
    if (connection) {
      try { await connection.end(); } catch (e) { /* ignore */ }
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get participant details',
      error: error.message
    });
  }
};
