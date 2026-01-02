const testLogin = async (username, password, type) => {
    console.log(`\nTesting ${type} login: ${username}`);
    try {
        const res = await fetch('http://localhost:5001/api/mobile/auth/staff-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        console.log(`  Status: ${res.status}`);
        console.log(`  Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.log(`  Error: ${err.message}`);
    }
};

const testLoginUser = async (username, password, type) => {
    console.log(`\nTesting ${type} login: ${username}`);
    try {
        const res = await fetch('http://localhost:5001/api/mobile/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        console.log(`  Status: ${res.status}`);
        console.log(`  Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.log(`  Error: ${err.message}`);
    }
};

console.log('🧪 Login Test Suite');
console.log('==================');

await testLogin('INS1731', 'password123', 'Inspector');
await testLogin('COL6806', 'password123', 'Collector');
await testLoginUser('25-39683', 'password123', 'Stallholder');
