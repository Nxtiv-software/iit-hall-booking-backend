// Using native fetch in Node 24

async function createSuperAdmin() {
  try {
    const response = await fetch("http://localhost:8800/auth/super-admins/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "superadmin@iit.edu",
        password: "Password@123",
        username: "superadmin_main",
        firstName: "Super",
        lastName: "Admin",
        gender: "Other",
        phoneNum: "0123456789"
      })
    });

    const data = await response.json();
    console.log("Response:", response.status, data);
  } catch (err) {
    console.error("Error:", err);
  }
}

createSuperAdmin();
