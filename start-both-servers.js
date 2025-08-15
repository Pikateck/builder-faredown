const { spawn } = require('child_process');
const path = require('path');

// Start the frontend dev server
console.log('🚀 Starting frontend dev server...');
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  console.log(`[FRONTEND] ${data.toString().trim()}`);
});

frontend.stderr.on('data', (data) => {
  console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
});

// Start the API server
console.log('🚀 Starting API server...');
const api = spawn('node', ['api/pricing-server.js'], {
  stdio: 'pipe',
  shell: true
});

api.stdout.on('data', (data) => {
  console.log(`[API] ${data.toString().trim()}`);
});

api.stderr.on('data', (data) => {
  console.error(`[API ERROR] ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  frontend.kill();
  api.kill();
  process.exit(0);
});

console.log('✅ Both servers starting...');
console.log('📱 Frontend: http://localhost:8080');
console.log('🔧 API: http://localhost:3001');
