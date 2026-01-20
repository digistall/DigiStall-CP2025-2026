// ===== NAGA STALL UNIFIED BACKEND ENTRY POINT =====
// This file starts both Web and Mobile backend servers

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('  NAGA STALL UNIFIED BACKEND - Starting All Servers');
console.log('='.repeat(60));

// Start Web Backend
const webBackend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'Backend-Web'),
  stdio: 'inherit',
  shell: true
});

webBackend.on('error', (err) => {
  console.error('Failed to start Web Backend:', err);
});

// Start Mobile Backend
const mobileBackend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'Backend-Mobile'),
  stdio: 'inherit',
  shell: true
});

mobileBackend.on('error', (err) => {
  console.error('Failed to start Mobile Backend:', err);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down all servers...');
  webBackend.kill();
  mobileBackend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down all servers...');
  webBackend.kill();
  mobileBackend.kill();
  process.exit(0);
});

console.log('Web Backend starting on port:', process.env.WEB_PORT || 3001);
console.log('Mobile Backend starting on port:', process.env.MOBILE_PORT || 3002);
console.log('='.repeat(60));
