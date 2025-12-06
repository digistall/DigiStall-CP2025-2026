const https = require('http');

async function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username: '25-93345', password: 'eya833' });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/mobile/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('=== LOGIN RESPONSE ===');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.success && result.data) {
            console.log('\n=== DATA SUMMARY ===');
            console.log('User:', result.data.user?.full_name);
            console.log('Is Stallholder:', result.data.isStallholder);
            console.log('Application Status:', result.data.applicationStatus);
            console.log('Spouse:', result.data.spouse ? result.data.spouse.full_name : 'No spouse');
            console.log('Business:', result.data.business ? result.data.business.nature_of_business : 'No business');
            console.log('Stallholder Payment:', result.data.stallholder?.payment_status);
          }
          resolve(result);
        } catch (e) {
          console.error('Parse error:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

testLogin();
