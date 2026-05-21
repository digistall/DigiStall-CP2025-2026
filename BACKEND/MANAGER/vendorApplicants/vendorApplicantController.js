import { createConnection } from '../../../config/database.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { normalizeEmail, toNull } from '../../utils/helpers.js'

const normalizeStatus = (status) => String(status || '').trim().toLowerCase()

const generateVendorPassword = (length = 10) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const all = uppercase + lowercase + numbers

  let password = ''
  password += uppercase[crypto.randomInt(uppercase.length)]
  password += lowercase[crypto.randomInt(lowercase.length)]
  password += numbers[crypto.randomInt(numbers.length)]

  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)]
  }

  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('')
}

export const getVendorApplicants = async (req, res) => {
  let connection
  try {
    const { status, search } = req.query
    const conditions = []
    const params = []

    if (status) {
      conditions.push('application_status = ?')
      params.push(normalizeStatus(status))
    }

    if (search) {
      const like = `%${String(search).toLowerCase()}%`
      conditions.push(
        '(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ?)',
      )
      params.push(like, like, like)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    connection = await createConnection()
    const [rows] = await connection.execute(
      `SELECT
        vendor_applicant_id,
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
        application_status,
        decline_reason,
        approved_at,
        rejected_at,
        vendor_id,
        vendor_account_id,
        created_at,
        updated_at
      FROM vendor_applicant
      ${whereClause}
      ORDER BY created_at DESC`,
      params,
    )

    return res.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error('❌ Error fetching vendor applicants:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor applicants.',
      error: error.message,
    })
  } finally {
    if (connection) await connection.end()
  }
}

export const getVendorApplicantById = async (req, res) => {
  let connection
  try {
    const { id } = req.params
    connection = await createConnection()

    const [rows] = await connection.execute(
      `SELECT
        vendor_applicant_id,
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
        application_status,
        decline_reason,
        approved_at,
        rejected_at,
        vendor_id,
        vendor_account_id,
        created_at,
        updated_at
      FROM vendor_applicant
      WHERE vendor_applicant_id = ?`,
      [id],
    )

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Vendor applicant not found.',
      })
    }

    return res.json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error('❌ Error fetching vendor applicant:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor applicant.',
      error: error.message,
    })
  } finally {
    if (connection) await connection.end()
  }
}

export const approveVendorApplicant = async (req, res) => {
  let connection
  try {
    const { id } = req.params
    connection = await createConnection()
    await connection.beginTransaction()

    const [rows] = await connection.execute(
      'SELECT * FROM vendor_applicant WHERE vendor_applicant_id = ? FOR UPDATE',
      [id],
    )

    if (!rows.length) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Vendor applicant not found.',
      })
    }

    const applicant = rows[0]
    const currentStatus = normalizeStatus(applicant.application_status)

    if (currentStatus === 'approved') {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'This vendor applicant is already approved.',
      })
    }

    const normalizedEmail = normalizeEmail(applicant.email)

    const [[existingAccount]] = await connection.execute(
      'SELECT vendor_account_id FROM vendor_account WHERE LOWER(vendor_email) = ? LIMIT 1',
      [normalizedEmail],
    )

    if (existingAccount) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'This email is already associated with a vendor account.',
      })
    }

    const [[existingVendor]] = await connection.execute(
      'SELECT vendor_id FROM vendor WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail],
    )

    if (existingVendor) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'This email is already associated with a vendor record.',
      })
    }

    const [businessResult] = await connection.execute(
      `INSERT INTO vendor_business (
        business_name,
        business_type,
        business_description,
        products,
        vending_time_start,
        vending_time_end
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        toNull(applicant.business_name),
        toNull(applicant.business_type),
        toNull(applicant.business_description),
        toNull(applicant.products),
        null,
        null,
      ],
    )

    const vendorBusinessId = businessResult.insertId

    const [vendorResult] = await connection.execute(
      `INSERT INTO vendor (
        first_name,
        last_name,
        middle_name,
        suffix,
        contact_number,
        email,
        birthdate,
        gender,
        address,
        civil_status,
        vendor_identifier,
        status,
        vendor_spouse_id,
        vendor_child_id,
        vendor_business_id,
        assigned_location_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toNull(applicant.first_name),
        toNull(applicant.last_name),
        toNull(applicant.middle_name),
        toNull(applicant.suffix),
        toNull(applicant.contact_number),
        normalizedEmail,
        toNull(applicant.birthdate),
        toNull(applicant.gender),
        toNull(applicant.address),
        toNull(applicant.civil_status),
        null,
        'Active',
        null,
        null,
        vendorBusinessId,
        null,
      ],
    )

    const vendorId = vendorResult.insertId

    const generatedPassword = generateVendorPassword(10)
    const passwordHash = await bcrypt.hash(generatedPassword, 10)

    const [accountResult] = await connection.execute(
      `INSERT INTO vendor_account (
        vendor_email,
        vendor_password
      ) VALUES (?, ?)`,
      [normalizedEmail, passwordHash],
    )

    const vendorAccountId = accountResult.insertId

    await connection.execute(
      `UPDATE vendor_applicant
       SET application_status = 'approved',
           approved_at = NOW(),
           vendor_id = ?,
           vendor_account_id = ?,
           updated_at = NOW()
       WHERE vendor_applicant_id = ?`,
      [vendorId, vendorAccountId, id],
    )

    await connection.commit()

    return res.json({
      success: true,
      message: 'Vendor applicant approved successfully.',
      data: {
        vendor_applicant_id: applicant.vendor_applicant_id,
        vendor_id: vendorId,
        vendor_account_id: vendorAccountId,
        email: normalizedEmail,
        password: generatedPassword,
        approved_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error('❌ Error approving vendor applicant:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to approve vendor applicant.',
      error: error.message,
    })
  } finally {
    if (connection) await connection.end()
  }
}

export const updateVendorApplicantStatus = async (req, res) => {
  let connection
  try {
    const { id } = req.params
    const { status, decline_reason } = req.body
    const normalizedStatus = normalizeStatus(status)

    if (!['pending', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: pending, rejected.',
      })
    }

    if (normalizedStatus === 'rejected' && (!decline_reason || decline_reason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'A detailed decline reason (at least 10 characters) is required.',
      })
    }

    connection = await createConnection()

    const declineValue = normalizedStatus === 'rejected' ? decline_reason.trim() : null
    const rejectedAt = normalizedStatus === 'rejected' ? new Date() : null

    const [result] = await connection.execute(
      `UPDATE vendor_applicant
       SET application_status = ?,
           decline_reason = ?,
           rejected_at = ?,
           updated_at = NOW()
       WHERE vendor_applicant_id = ?`,
      [normalizedStatus, declineValue, rejectedAt, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor applicant not found.',
      })
    }

    return res.json({
      success: true,
      message: 'Vendor applicant status updated successfully.',
    })
  } catch (error) {
    console.error('❌ Error updating vendor applicant status:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update vendor applicant status.',
      error: error.message,
    })
  } finally {
    if (connection) await connection.end()
  }
}
