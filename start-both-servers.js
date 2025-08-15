import { spawn } from 'child_process';

// Start ONLY the unified dev server
console.log('🚀 Starting unified Faredown server...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  console.log(`${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[ERROR] ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill();
  process.exit(0);
});

console.log('✅ Unified server starting...');
console.log('📱 Faredown: http://localhost:8080');
console.log('🔧 Frontend + API: Single port 8080');
