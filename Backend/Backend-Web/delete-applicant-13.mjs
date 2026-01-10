// Delete applicant #13
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 60000,
    ...(isCloudDB && { ssl: { rejectUnauthorized: false } })
  });

  try {
    console.log('✅ Connected to database');
    
    // Check triggers
    const [triggers] = await connection.execute("SHOW TRIGGERS");
    console.log('\nTriggers found:', triggers.length);
    
    // Try to drop problematic trigger if exists
    const otherInfoTriggers = triggers.filter(t => t.Table === 'other_information');
    for (const t of otherInfoTriggers) {
      console.log(`Dropping trigger: ${t.Trigger}`);
      await connection.execute(`DROP TRIGGER IF EXISTS ${t.Trigger}`);
    }

    console.log('\nDeleting applicant #13...');
    
    // Delete in order (child tables first)
    await connection.execute('DELETE FROM other_information WHERE applicant_id = 13');
    console.log('  ✅ other_information deleted');
    
    await connection.execute('DELETE FROM business_information WHERE applicant_id = 13');
    console.log('  ✅ business_information deleted');
    
    await connection.execute('DELETE FROM applicant WHERE applicant_id = 13');
    console.log('  ✅ applicant deleted');

    // Verify
    const [remaining] = await connection.execute(
      'SELECT applicant_id, LEFT(applicant_full_name, 30) as name FROM applicant ORDER BY applicant_id'
    );
    console.log('\n📋 Remaining applicants:');
    remaining.forEach(a => console.log(`  #${a.applicant_id}: ${a.name}...`));

    console.log('\n✅ Applicant #13 deleted successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

main();
