// Reset and recreate super admin
// Run this AFTER fixing the Firebase credentials in .env

async function resetSuperAdmin() {
  const BASE_URL = "http://localhost:8800";
  const EMAIL = "superadmin@iit.edu";
  const PASSWORD = "Password@123";

  try {
    // Step 1: Delete existing superadmin from DB via a direct reset endpoint
    // We'll just re-try registration — if 409, we need to delete from DB first
    console.log("Attempting to register super admin...");

    const response = await fetch(`${BASE_URL}/auth/super-admins/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        username: "superadmin_main",
        firstName: "Super",
        lastName: "Admin",
        gender: "Other",
        phoneNum: "0123456789",
      }),
    });

    const data = await response.json();

    if (response.status === 409) {
      console.log("⚠️  User already exists in DB (status 409).");
      console.log("👉 You need to delete the existing record from the database.");
      console.log("   Open Prisma Studio at http://localhost:5555");
      console.log("   1. Go to 'SuperAdmin' table → delete the row");
      console.log("   2. Go to 'User' table → find superadmin@iit.edu → delete");
      console.log("   3. Then run this script again: node reset-superadmin.js");
      return;
    }

    if (!response.ok) {
      console.error("❌ Failed:", response.status, data);
      return;
    }

    console.log("✅ Super admin created successfully!");
    console.log("   Email:", EMAIL);
    console.log("   Password:", PASSWORD);
    console.log("   Response:", data);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

resetSuperAdmin();
