import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
};

async function test() {
    const conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected');
    
    // Get applicant data with exact same query as approveApplicant.js
    console.log('\n📋 Getting applicant 11 data with exact approveApplicant query...');
    const [applicantRows] = await conn.query(`
      SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        COALESCE(oi.email_address, a.applicant_email) as email_address,
        bi.nature_of_business as business_name,
        bi.nature_of_business as business_type
      FROM applicant a
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      WHERE a.applicant_id = 11
    `);
    
    console.log('  Raw applicant:', JSON.stringify(applicantRows[0], null, 2));
    
    // Get application details  
    console.log('\n📋 Getting pending application...');
    const [applicationRows] = await conn.query(`
      SELECT 
        app.application_id,
        app.stall_id,
        st.rental_price,
        st.price_type,
        sec.section_id,
        f.floor_id,
        f.branch_id
      FROM application app
      JOIN stall st ON app.stall_id = st.stall_id
      JOIN section sec ON st.section_id = sec.section_id
      JOIN floor f ON sec.floor_id = f.floor_id
      WHERE app.applicant_id = 11 AND app.application_status = 'Pending'
      ORDER BY app.application_date DESC
      LIMIT 1
    `);
    console.log('  Application:', applicationRows[0]);
    
    // Check required columns in stallholder table
    console.log('\n📋 Checking required columns in stallholder...');
    const [stallholderCols] = await conn.query('SHOW COLUMNS FROM stallholder WHERE `Null` = "NO"');
    console.log('  Required columns:', stallholderCols.map(c => c.Field).join(', '));
    
    await conn.end();
}

test().catch(console.error);
