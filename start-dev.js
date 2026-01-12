const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Blood Donate Development Servers...\n');

// Start backend server
console.log('📡 Starting Backend Server...');
const backend = spawn('node', ['index-simple.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Start frontend server
console.log('🎨 Starting Frontend Server...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});

backend.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend server exited with code ${code}`);
});