// ===== UNIFIED BACKEND LAUNCHER =====
// Starts both Web and Mobile backend servers

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🚀 Starting Naga Stall Unified Backend System...\n');

// Server configurations
const servers = [
  {
    name: 'Backend-Web',
    path: path.join(__dirname, 'Backend-Web'),
    script: 'server.js',
    port: process.env.WEB_PORT || 3001,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Backend-Mobile',
    path: path.join(__dirname, 'Backend-Mobile'),
    script: 'server.js',
    port: process.env.MOBILE_PORT || 3002,
    color: '\x1b[35m' // Magenta
  }
];

const processes = [];

// Function to start a server
function startServer(server) {
  return new Promise((resolve, reject) => {
    console.log(`${server.color}[${server.name}]\x1b[0m Starting on port ${server.port}...`);
    
    const serverProcess = spawn('node', [server.script], {
      cwd: server.path,
      stdio: 'inherit',
      shell: true
    });

    serverProcess.on('error', (error) => {
      console.error(`${server.color}[${server.name}]\x1b[0m Error: ${error.message}`);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${server.color}[${server.name}]\x1b[0m Exited with code ${code}`);
      }
    });

    processes.push({ name: server.name, process: serverProcess });
    
    // Give it a moment to start
    setTimeout(() => resolve(), 1000);
  });
}

// Start all servers
async function startAllServers() {
  try {
    for (const server of servers) {
      await startServer(server);
    }
    
    console.log('\n✅ All backend servers started successfully!\n');
    console.log('📍 Servers running:');
    servers.forEach(server => {
      console.log(`   ${server.color}• ${server.name}\x1b[0m - http://localhost:${server.port}`);
    });
    console.log('\n💡 Press Ctrl+C to stop all servers\n');
    
  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown() {
  console.log('\n\n🛑 Shutting down all servers...\n');
  
  processes.forEach(({ name, process }) => {
    console.log(`   Stopping ${name}...`);
    process.kill('SIGTERM');
  });
  
  setTimeout(() => {
    console.log('\n✅ All servers stopped.\n');
    process.exit(0);
  }, 2000);
}

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the servers
startAllServers();
