/**
 * setup-superadmin.mjs
 * Deletes any existing super admin from DB and Firebase,
 * then creates a fresh one in both Firebase Auth and PostgreSQL.
 *
 * Run with: node setup-superadmin.mjs
 */

import { PrismaClient } from "./src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import admin from "firebase-admin";
import "dotenv/config";

const EMAIL = "superadmin@iit.edu";
const PASSWORD = "Password@123";
const USERNAME = "superadmin_main";
const FIRST_NAME = "Super";
const LAST_NAME = "Admin";
const GENDER = "Other";
const PHONE = "0123456789";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SECRET_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Initialize Prisma with PrismaPg adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("🔧 Starting super admin setup...\n");

  // ── Step 1: Delete from DB ─────────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({
    where: { uniEmail: EMAIL },
    include: { superAdmin: true },
  });

  if (existingUser) {
    console.log("🗑  Found existing user in DB — deleting...");
    if (existingUser.superAdmin) {
      await prisma.superAdmin.delete({ where: { userId: existingUser.id } });
      console.log("   ✅ SuperAdmin record deleted");
    }
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log("   ✅ User record deleted");
  } else {
    console.log("ℹ️  No existing user found in DB");
  }

  // ── Step 2: Delete from Firebase Auth (if exists) ─────────────────────────
  try {
    const fbUser = await admin.auth().getUserByEmail(EMAIL);
    await admin.auth().deleteUser(fbUser.uid);
    console.log("🗑  Deleted existing Firebase Auth user");
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log("ℹ️  No existing Firebase Auth user found");
    } else {
      throw err;
    }
  }

  // ── Step 3: Create fresh Firebase Auth user ────────────────────────────────
  console.log("\n🔥 Creating Firebase Auth user...");
  const fbUser = await admin.auth().createUser({ email: EMAIL, password: PASSWORD });
  console.log("   ✅ Firebase user created:", fbUser.uid);

  // ── Step 4: Create fresh DB records ───────────────────────────────────────
  console.log("\n💾 Creating database records...");
  const role = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!role) throw new Error('Role "SUPER_ADMIN" not found in database!');

  const user = await prisma.user.create({
    data: {
      username: USERNAME,
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      uniEmail: EMAIL,
      gender: GENDER,
      phoneNum: PHONE,
      roleId: role.id,
    },
  });
  console.log("   ✅ User record created:", user.id);

  const superAdmin = await prisma.superAdmin.create({
    data: { userId: user.id },
  });
  console.log("   ✅ SuperAdmin record created:", superAdmin.id);

  console.log("\n✅ Super admin setup complete!");
  console.log("   Email:   ", EMAIL);
  console.log("   Password:", PASSWORD);

  await prisma.$disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("\n❌ Error:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
