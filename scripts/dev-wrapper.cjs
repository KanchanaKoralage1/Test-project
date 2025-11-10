#!/usr/bin/env node
/**
 * dev-wrapper.cjs
 * Cross-platform development startup script for the Acquisition App
 * Works on Windows, macOS, and Linux
 */

const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Starting Acquisition App in Development Mode");
console.log("================================================");

// 1. Check if .env.development exists
if (!fs.existsSync(".env.development")) {
  console.error("❌ Error: .env.development file not found!");
  console.error("   Please copy .env.development from the template and update with your Neon credentials.");
  process.exit(1);
}

// 2. Check if Docker is running
try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error("❌ Error: Docker is not running!");
  console.error("   Please start Docker Desktop and try again.");
  process.exit(1);
}

// 3. Create .neon_local directory if it doesn't exist
if (!fs.existsSync(".neon_local")) {
  fs.mkdirSync(".neon_local");
}

// 4. Add .neon_local/ to .gitignore if not already present
try {
  const gitignore = fs.readFileSync(".gitignore", "utf8");
  if (!gitignore.includes(".neon_local/")) {
    fs.appendFileSync(".gitignore", "\n.neon_local/");
    console.log("✅ Added .neon_local/ to .gitignore");
  }
} catch {
  fs.writeFileSync(".gitignore", ".neon_local/\n");
  console.log("✅ Created .gitignore and added .neon_local/");
}

console.log("📦 Building and starting development containers...");
console.log("   - Neon Local proxy will create an ephemeral database branch");
console.log("   - Application will run with hot reload enabled");
console.log("");

// 5. Run migrations with Drizzle
console.log("📜 Applying latest schema with Drizzle...");
try {
  execSync("npm run db:migrate", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Migration failed. Check your Drizzle setup.");
  process.exit(1);
}

// 6. Wait for the database to be ready
console.log("⏳ Waiting for the database to be ready...");
try {
  execSync(`docker compose exec neon-local psql -U neon -d neondb -c "SELECT 1"`, { stdio: "inherit" });
} catch {
  console.warn("⚠️ Database check failed. Continuing startup...");
}

// 7. Start development environment
console.log("▶️ Starting development environment...");
try {
  execSync("docker compose -f docker-compose.dev.yml up --build", { stdio: "inherit" });
} catch {
  console.error("❌ Failed to start Docker Compose environment.");
  process.exit(1);
}

console.log("");
console.log("🎉 Development environment started successfully!");
console.log("   Application: http://localhost:5173");
console.log("   Database: postgres://neon:npg@localhost:5432/neondb");
console.log("");
console.log("To stop the environment, press Ctrl+C or run: docker compose down");
