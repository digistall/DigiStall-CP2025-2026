import { createConnection } from '../../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const buildFullName = (vendor) => {
  const parts = [vendor.first_name, vendor.middle_name, vendor.last_name, vendor.suffix]
  return parts.filter(Boolean).join(' ').trim()
}

export const vendorLogin = async (req, res) => {
  let connection
  try {
    const { email, username, password } = req.body
    const loginEmail = normalizeEmail(email || username)

    if (!loginEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    connection = await createConnection()

    const [rows] = await connection.execute(
      `SELECT
        va.vendor_account_id,
        va.vendor_id,
        va.vendor_email AS email,
        va.vendor_password_hash AS password_hash,
        va.status AS account_status,
        v.status,
        v.first_name,
        v.middle_name,
        v.last_name,
        v.suffix,
        v.contact_number,
        v.birthdate,
        v.gender,
        v.address,
        v.civil_status,
        v.vendor_identifier,
        v.assigned_location_id,
        al.location_name,
        vb.vendor_business_id,
        vb.business_name,
        vb.business_type,
        vb.business_description,
        vb.products
      FROM vendor_account va
      JOIN vendor v ON va.vendor_id = v.vendor_id
      LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
      LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
      WHERE LOWER(va.vendor_email) = ?
      LIMIT 1`,
      [loginEmail],
    )

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      })
    }

    const account = rows[0]

    if (account.account_status && account.account_status.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This vendor account is inactive.',
      })
    }

    const passwordValid = await bcrypt.compare(password, account.password_hash)
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      })
    }

    // Skip last_login update as vendor_account table does not have last_login or updated_at columns
    // in the current database schema.
    
    const fullName = buildFullName(account)

    const token = jwt.sign(
      {
        userId: account.vendor_account_id,
        vendorId: account.vendor_id,
        vendorAccountId: account.vendor_account_id,
        email: account.email,
        fullName,
        userType: 'vendor',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return res.json({
      success: true,
      message: 'Vendor login successful',
      token,
      data: {
        vendor: {
          vendor_id: account.vendor_id,
          vendor_identifier: account.vendor_identifier || null,
          full_name: fullName,
          first_name: account.first_name,
          middle_name: account.middle_name,
          last_name: account.last_name,
          suffix: account.suffix,
          email: account.email,
          contact_number: account.contact_number,
          birthdate: account.birthdate,
          gender: account.gender,
          address: account.address,
          civil_status: account.civil_status,
          location_name: account.location_name || null,
        },
        business: account.vendor_business_id
          ? {
              vendor_business_id: account.vendor_business_id,
              business_name: account.business_name,
              business_type: account.business_type,
              business_description: account.business_description,
              products: account.products,
            }
          : null,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Vendor login failed.',
    })
  } finally {
    if (connection) await connection.end()
  }
}
