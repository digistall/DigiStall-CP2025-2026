import { createConnection } from '../../config/database.js'
import {
  normalizeEmail,
  toNull,
  isValidEmail,
  isValidContactNumber,
  isValidBirthdate,
} from '../utils/helpers.js'

export const submitVendorApplication = async (req, res) => {
  let connection

  try {
    const {
      first_name,
      middle_name,
      last_name,
      suffix,
      contact_number,
      email,
      birthdate,
      gender,
      address,
      civil_status,
      business_name,
      business_type,
      business_description,
      products,
    } = req.body

    if (
      !first_name ||
      !last_name ||
      !contact_number ||
      !email ||
      !birthdate ||
      !gender ||
      !address ||
      !civil_status ||
      !business_name ||
      !business_type ||
      !business_description ||
      !products
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided.',
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      })
    }

    if (!isValidContactNumber(contact_number)) {
      return res.status(400).json({
        success: false,
        message: 'A valid contact number is required.',
      })
    }

    const birthdateCheck = isValidBirthdate(birthdate, 18)
    if (!birthdateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: birthdateCheck.reason,
      })
    }

    const normEmail = normalizeEmail(email)

    connection = await createConnection()

    const [existing] = await connection.execute(
      'SELECT vendor_applicant_id, application_status FROM vendor_applicant WHERE email = ?',
      [normEmail],
    )

    if (existing.length > 0) {
      const isPendingOrApproved = existing.some(
        (app) => app.application_status === 'pending' || app.application_status === 'approved',
      )

      if (isPendingOrApproved) {
        return res.status(400).json({
          success: false,
          message: 'An application with this email address is already pending or approved.',
        })
      }
    }

    await connection.execute(
      `
      INSERT INTO vendor_applicant (
        first_name, middle_name, last_name, suffix,
        contact_number, email, birthdate, gender, address, civil_status,
        business_name, business_type, business_description, products,
        application_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        toNull(first_name),
        toNull(middle_name),
        toNull(last_name),
        toNull(suffix),
        toNull(contact_number),
        normEmail,
        toNull(birthdate),
        toNull(gender),
        toNull(address),
        toNull(civil_status),
        toNull(business_name),
        toNull(business_type),
        toNull(business_description),
        toNull(products),
      ],
    )

    return res.status(201).json({
      success: true,
      message: 'Vendor application submitted successfully.',
    })
  } catch (error) {
    console.error('Error submitting vendor application:', error)
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your application.',
    })
  } finally {
    if (connection) {
      connection.end()
    }
  }
}
