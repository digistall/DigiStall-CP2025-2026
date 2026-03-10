import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Adding columns to system_administrator...');
    await connection.execute(`ALTER TABLE system_administrator ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL, ADD COLUMN gender VARCHAR(20) NULL`).catch(e => console.log('system_admin columns already exist or error:', e.message));

    console.log('Adding columns to stall_business_owner...');
    await connection.execute(`ALTER TABLE stall_business_owner ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL, ADD COLUMN gender VARCHAR(20) NULL, ADD COLUMN address TEXT NULL`).catch(e => console.log('stall_business_owner columns already exist or error:', e.message));

    console.log('Adding columns to business_manager...');
    await connection.execute(`ALTER TABLE business_manager ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL, ADD COLUMN gender VARCHAR(20) NULL, ADD COLUMN address TEXT NULL`).catch(e => console.log('business_manager columns already exist or error:', e.message));

    console.log('Adding columns to business_employee...');
    await connection.execute(`ALTER TABLE business_employee ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL, ADD COLUMN gender VARCHAR(20) NULL, ADD COLUMN address TEXT NULL`).catch(e => console.log('business_employee columns already exist or error:', e.message));

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
