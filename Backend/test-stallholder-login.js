import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function testStallholderLogin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall'
    });

    const username = '25-39683';
    const password = 'password123';

    console.log('🔍 Testing stallholder login for:', username);
    console.log('');

    // Step 1: Get credential
    const [creds] = await connection.query(`
        SELECT 
          c.registrationid,
          c.applicant_id,
          c.user_name,
          c.password_hash,
          c.is_active
        FROM credential c
        WHERE c.user_name = ?
        LIMIT 1
    `, [username]);

    if (creds.length === 0) {
        console.log('❌ No credential found');
        await connection.end();
        return;
    }

    const cred = creds[0];
    console.log('✅ Found credential:');
    console.log('   - registrationid:', cred.registrationid);
    console.log('   - applicant_id:', cred.applicant_id);
    console.log('   - user_name:', cred.user_name);
    console.log('   - is_active:', cred.is_active);
    console.log('   - password_hash preview:', cred.password_hash?.substring(0, 20) + '...');
    console.log('');

    // Step 2: Test password
    console.log('🔐 Testing password...');
    try {
        const isValid = await bcrypt.compare(password, cred.password_hash);
        console.log('   - bcrypt.compare result:', isValid);
    } catch (e) {
        console.log('   - bcrypt.compare error:', e.message);
    }
    console.log('');

    // Step 3: Test stored procedure
    console.log('📦 Testing getAppliedAreasByApplicant...');
    try {
        const [areas] = await connection.execute('CALL getAppliedAreasByApplicant(?)', [cred.applicant_id]);
        console.log('   - Result:', JSON.stringify(areas[0] || [], null, 2));
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 4: Test another stored procedure
    console.log('📦 Testing getApplicantApplicationsDetailed...');
    try {
        const [apps] = await connection.execute('CALL getApplicantApplicationsDetailed(?)', [cred.applicant_id]);
        console.log('   - Result count:', (apps[0] || []).length);
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 5: Test available stalls procedure
    console.log('📦 Testing getAvailableStallsByApplicant...');
    try {
        const [stalls] = await connection.execute('CALL getAvailableStallsByApplicant(?)', [cred.applicant_id]);
        console.log('   - Result count:', (stalls[0] || []).length);
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 6: Test additional info procedure
    console.log('📦 Testing getApplicantAdditionalInfo...');
    try {
        const [info] = await connection.execute('CALL getApplicantAdditionalInfo(?)', [cred.applicant_id]);
        console.log('   - Result:', JSON.stringify(info[0] && info[0][0] ? info[0][0] : null, null, 2));
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 7: Test stallholder info procedure
    console.log('📦 Testing sp_getFullStallholderInfo...');
    try {
        const [stallholder] = await connection.execute('CALL sp_getFullStallholderInfo(?)', [cred.applicant_id]);
        console.log('   - Result:', JSON.stringify(stallholder[0] && stallholder[0][0] ? stallholder[0][0] : null, null, 2));
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 8: Test application info procedure
    console.log('📦 Testing sp_getLatestApplicationInfo...');
    try {
        const [app] = await connection.execute('CALL sp_getLatestApplicationInfo(?)', [cred.applicant_id]);
        console.log('   - Result:', JSON.stringify(app[0] && app[0][0] ? app[0][0] : null, null, 2));
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    // Step 9: Test update last login procedure
    console.log('📦 Testing updateCredentialLastLogin...');
    try {
        await connection.execute('CALL updateCredentialLastLogin(?)', [cred.applicant_id]);
        console.log('   - Success');
    } catch (e) {
        console.log('   - Error:', e.message);
    }
    console.log('');

    await connection.end();
    console.log('✅ Tests complete');
}

testStallholderLogin().catch(console.error);
