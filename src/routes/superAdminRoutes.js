import express from "express";
import prisma from "../prismaClient.js";
import admin from "../Firebase/firebaseAdmin.js";

const router = express.Router();

// Creating a SuperAdmin account
router.post("/:superAdminId/register", async (req, res) => {
  const { superAdminId } = req.params;

  const {
    email,
    password,
    username,
    firstName,
    lastName,
    gender,
    phoneNum,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
    });
  }

  try {
    const requestingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!requestingSuperAdmin || requestingSuperAdmin.user.role.name !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only SuperAdmins can create accounts.",
      });
    }

    const firebaseUser = await admin.auth().createUser({ email, password });

    const superAdminRole = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });

    if (!superAdminRole) {
      await admin.auth().deleteUser(firebaseUser.uid);
      return res.status(400).json({
        message: "SUPER_ADMIN role not found. Please seed roles.",
      });
    }

    let finalUsername = username;
    let counter = 1;

    while (
      await prisma.user.findUnique({ where: { username: finalUsername } })
    ) {
      finalUsername = `${username}${counter++}`;
    }

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        firstName,
        lastName,
        uniEmail: email,
        gender,
        phoneNum,
        roleId: superAdminRole.id,
      },
    });


    const superAdmin = await prisma.superAdmin.create({
      data: {
        userId: user.id,
      },
    });

    return res.status(201).json({
      message: "SuperAdmin created successfully",
      firebaseUid: firebaseUser.uid,
      user,
      superAdmin,
    });
  } catch (error) {
    console.error(error);
    if (firebaseUser?.uid) {
      await admin.auth().deleteUser(firebaseUser.uid);
    }

    return res.status(500).json({
      message: "Failed to create SuperAdmin",
      error: error.message,
    });
  }
});

// Update super admin profile
router.put("/me", async (req, res) => {
  try {
    const { firstName, lastName, gender, avatarUrl, phoneNum, uniEmail, username } = req.body;

    const superAdminExist = await prisma.superAdmin.findUnique({
      where: { userId: req.user.id },
    });

    if (!superAdminExist) {
      return res.status(404).json({ message: "SuperAdmin profile not found" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username,
        firstName,
        lastName,
        gender,
        avatarUrl,
        phoneNum,
        uniEmail,
      },
    });

    return res.json({
      message: "SuperAdmin profile updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Delete superAdmin profile
router.delete("/me", async (req, res) => {
  try {
    const userId = req.user.id;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userRecord) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      const firebaseUser = await admin.auth().getUserByEmail(userRecord.email);
      await admin.auth().deleteUser(firebaseUser.uid);
    } catch (firebaseError) {
      console.warn("Firebase user not found or already deleted:", firebaseError.message);
    }

    await prisma.superAdmin.delete({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });


    return res.json({ message: "SuperAdmin account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Create admin profile
router.post("/:superAdminId/admins/register", async (req, res) => {
  const { superAdminId } = req.params;

  const {
    email,
    password,
    username,
    firstName,
    lastName,
    gender,
    phoneNum,
    adminLevel,
    departmentId,
    buildingId,
  } = req.body;

  if (!email || !password || adminLevel == null) {
    return res.status(400).json({
      message: "email, password, username and adminLevel are required",
    });
  }

  let firebaseUser;

  try {
    const requestingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
      include: {
        user: { include: { role: true } },
      },
    });

    if (!requestingSuperAdmin || requestingSuperAdmin.user.role.name !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only SuperAdmins can create Admin accounts.",
      });
    }

    firebaseUser = await admin.auth().createUser({ email, password });

    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      await admin.auth().deleteUser(firebaseUser.uid);
      return res.status(500).json({ message: "ADMIN role not found" });
    }

    let finalUsername = username;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${username}${counter++}`;
    }

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        firstName,
        lastName,
        uniEmail: email,
        gender,
        phoneNum,
        roleId: adminRole.id,
      },
    });

    const adminProfile = await prisma.admin.create({
      data: {
        userId: user.id,
        adminLevel,
        departmentId,
        buildingId,
      },
    });

    return res.status(201).json({
      message: "Admin created successfully",
      firebaseUid: firebaseUser.uid,
      user,
      admin: adminProfile,
    });
  } catch (error) {
    console.error(error);

    if (firebaseUser?.uid) {
      await admin.auth().deleteUser(firebaseUser.uid);
    }

    return res.status(500).json({
      message: "Failed to create Admin",
      error: error.message,
    });
  }
});


// Update admin profile
router.put("/admins/:adminId", async (req, res) => {
  const { adminId } = req.params;
  const { username, firstName, lastName, uniEmail, gender, phoneNum, adminLevel, departmentId, buildingId } = req.body;

  try {
    const adminRecord = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!adminRecord) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const userId = adminRecord.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username, firstName, lastName, uniEmail, gender, phoneNum },
    });

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { adminLevel, departmentId, buildingId },
    });

    res.json({ user, admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete admin profile
router.delete("/admins/:adminId", async (req, res) => {
  const { adminId } = req.params;

  try {
    const adminRecord = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { user: true },
    });

    if (!adminRecord || !adminRecord.user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const userId = adminRecord.user.id;
    const email = adminRecord.user.uniEmail;

    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(firebaseUser.uid);
    } catch (firebaseError) {
      console.warn(
        "Firebase user not found or already deleted:",
        firebaseError.message
      );
    }

    await prisma.admin.delete({ where: { id: adminId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      message: "Admin profile, user account, and Firebase account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Create student profile
router.post("/:superAdminId/students/register", async (req, res) => {
  const { superAdminId } = req.params;

  const {
    email,
    password,
    username,
    firstName,
    lastName,
    gender,
    phoneNum,
    iitIdNumber,
    societyName,
    societyPosition,
  } = req.body;

  if (!email || !password || !iitIdNumber) {
    return res.status(400).json({
      message: "email, password and iitIdNumber are required",
    });
  }

  let firebaseUser;

  try {
    const requestingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
      include: {
        user: { include: { role: true } },
      },
    });

    if (!requestingSuperAdmin || requestingSuperAdmin.user.role.name !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only SuperAdmins can create Student accounts.",
      });
    }

    firebaseUser = await admin.auth().createUser({ email, password });

    const studentRole = await prisma.role.findUnique({
      where: { name: "STUDENT" },
    });

    if (!studentRole) {
      await admin.auth().deleteUser(firebaseUser.uid);
      return res.status(500).json({ message: "STUDENT role not found" });
    }

    let finalUsername = username;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${username}${counter++}`;
    }

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        firstName,
        lastName,
        uniEmail: email,
        gender,
        phoneNum,
        roleId: studentRole.id,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        iitIdNumber,
        societyName,
        societyPosition,
      },
    });

    return res.status(201).json({
      message: "Student created successfully",
      firebaseUid: firebaseUser.uid,
      user,
      student,
    });
  } catch (error) {
    console.error(error);

    if (firebaseUser?.uid) {
      await admin.auth().deleteUser(firebaseUser.uid);
    }

    return res.status(500).json({
      message: "Failed to create Student",
      error: error.message,
    });
  }
});

// Update student profile
router.put("/students/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { username, firstName, lastName, uniEmail, gender, phoneNum, iitIdNumber, societyName, societyPosition } = req.body;

  try {
    const studentRecord = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!studentRecord) {
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = studentRecord.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username, firstName, lastName, uniEmail, gender, phoneNum },
    });

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { iitIdNumber, societyName, societyPosition },
    });

    res.json({ user, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student profile
router.delete("/students/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const studentRecord = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!studentRecord || !studentRecord.user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = studentRecord.user.id;
    const email = studentRecord.user.uniEmail;

    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(firebaseUser.uid);
    } catch (firebaseError) {
      console.warn(
        "Firebase user not found or already deleted:",
        firebaseError.message
      );
    }

    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      message: "Student profile, user account, and Firebase account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;