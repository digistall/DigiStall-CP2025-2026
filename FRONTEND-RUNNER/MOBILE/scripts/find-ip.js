// IP Address Discovery Script
// Run this script to find your computer's IP address for mobile app configuration

const os = require('os');
const { exec } = require('child_process');

console.log('🔍 Discovering Network Configuration...\n');

// Get network interfaces
const interfaces = os.networkInterfaces();
console.log('📡 Available Network Interfaces:');

const ipAddresses = [];

Object.keys(interfaces).forEach((interfaceName) => {
  const interface = interfaces[interfaceName];
  
  interface.forEach((details) => {
    if (details.family === 'IPv4' && !details.internal) {
      console.log(`   ${interfaceName}: ${details.address}`);
      ipAddresses.push(details.address);
    }
  });
});

console.log('\n🎯 Recommended Server URLs for your mobile app:');
ipAddresses.forEach((ip, index) => {
  console.log(`   ${index + 1}. http://${ip}:3001`);
});

console.log('\n📋 Next Steps:');
console.log('1. Copy one of the IP addresses above');
console.log('2. Open config/networkConfig.js');
console.log('3. Add your IP to the SERVERS array');
console.log('4. Restart your mobile app');
console.log('\n✨ Your app will then work on any WiFi network!');

// Test if port 3001 is in use
console.log('\n🔍 Checking if port 3001 is available...');

exec('netstat -an | findstr :3001', (error, stdout, stderr) => {
  if (stdout) {
    console.log('✅ Port 3001 appears to be in use (good - server is running)');
    console.log('📡 Active connections on port 3001:');
    console.log(stdout);
  } else {
    console.log('⚠️  Port 3001 appears to be free');
    console.log('❗ Make sure your backend server is running with: npm start');
  }
});