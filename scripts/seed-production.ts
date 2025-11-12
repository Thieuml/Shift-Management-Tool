import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production seed...");

  // Check if data already exists
  const existingCountries = await prisma.country.count();
  if (existingCountries > 0) {
    console.log("⚠️  Database already contains data. Skipping seed.");
    console.log("   To reseed, clear the database first.");
    return;
  }

  // Import seed function from seed file
  const { execSync } = require("child_process");
  
  try {
    console.log("📦 Running seed script...");
    execSync("npm run db:seed", { stdio: "inherit" });
    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Production seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
