const mysql = require('mysql2/promise');
const { decryptData } = require('./services/encryptionService.js');

const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute('SELECT stallholder_id, full_name, status, payment_status, stall_id FROM stallholder');
    console.log('Stallholders:');
    const decrypted = rows.map(r => {
      let name = r.full_name;
      try {
        if (name && name.includes(':')) {
          name = decryptData(name);
        }
      } catch (e) {
        // ignore
      }
      return {
        stallholder_id: r.stallholder_id,
        name,
        status: r.status,
        payment_status: r.payment_status,
        stall_id: r.stall_id
      };
    });
    console.log(decrypted);
  } finally {
    await connection.end();
  }
}
check().catch(console.error);
