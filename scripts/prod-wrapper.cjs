#!/usr/bin/env node
/**
 * prod-wrapper.cjs
 * Cross-platform production deployment script for Acquisition App
 * Works on Windows, macOS, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Acquisition App in Production Mode');
console.log('===============================================');

// 1. Check if .env.production exists
if (!fs.existsSync('.env.production')) {
  console.error('❌ Error: .env.production file not found!');
  console.error(
    '   Please create .env.production with your production environment variables.'
  );
  process.exit(1);
}

// 2. Check if Docker is running
try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  console.error('❌ Error: Docker is not running!');
  console.error('   Please start Docker Desktop and try again.');
  process.exit(1);
}

console.log('📦 Building and starting production container...');
console.log('   - Using Neon Cloud Database (no local proxy)');
console.log('   - Running in optimized production mode');
console.log('');

// 3. Start production environment
try {
  execSync('docker compose -f docker-compose.prod.yml up --build -d', {
    stdio: 'inherit',
  });
} catch {
  console.error('❌ Failed to start production Docker Compose environment.');
  process.exit(1);
}

// 4. Wait for DB to be ready (basic health check)
console.log('⏳ Waiting for Neon Cloud to be ready...');
setTimeout(() => {
  try {
    console.log('📜 Applying latest schema with Drizzle...');
    execSync('npm run db:migrate', { stdio: 'inherit' });

    console.log('');
    console.log('🎉 Production environment started successfully!');
    console.log('   Application: http://localhost:3000');
    console.log('   Logs: docker logs acquisition-app-prod');
    console.log('');
    console.log('Useful commands:');
    console.log('   View logs: docker logs -f acquisition-app-prod');
    console.log('   Stop app: docker compose -f docker-compose.prod.yml down');
    console.log('');
  } catch {
    console.error(
      '❌ Failed to apply migrations. Check your database connection.'
    );
    process.exit(1);
  }
}, 5000);
