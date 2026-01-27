import express from "express";
import prisma from "../prismaClient.js";
import admin from "../Firebase/firebaseAdmin.js";

const router = express.Router();

// Get my super admin profile
router.get("/me", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            uniEmail: true,
            gender: true,
            phoneNum: true,
            avatarUrl: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!superAdmin) {
      return res.status(404).json({ message: "SuperAdmin profile not found" });
    }

    res.json(superAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create superadmin profile
router.post("/", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { email, password, username, firstName, lastName, gender, phoneNum } =
    req.body;
  let firebaseUser;

  try {
    const role = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });

    firebaseUser = await admin.auth().createUser({ email, password });

    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        uniEmail: email,
        gender,
        phoneNum,
        roleId: role.id,
      },
    });

    const superAdmin = await prisma.superAdmin.create({
      data: { userId: user.id },
    });

    res.status(201).json({ user, superAdmin });
  } catch (err) {
    if (firebaseUser?.uid) await admin.auth().deleteUser(firebaseUser.uid);
    res.status(500).json({ message: err.message });
  }
});

// Update superadmin profile
router.put("/:superAdminId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { superAdminId } = req.params;

  try {
    const sa = await prisma.superAdmin.findUnique({ where: { id } });
    if (!sa) return res.status(404).json({ message: "SuperAdmin not found" });

    const user = await prisma.user.update({
      where: { id: sa.userId },
      data: req.body,
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete supreadmin profile
router.delete("/:superAdminId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { superAdminId } = req.params;

  try {
    const sa = await prisma.superAdmin.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!sa) return res.status(404).json({ message: "SuperAdmin not found" });

    try {
      const fb = await admin.auth().getUserByEmail(sa.user.uniEmail);
      await admin.auth().deleteUser(fb.uid);
    } catch {}

    await prisma.superAdmin.delete({ where: { id } });
    await prisma.user.delete({ where: { id: sa.userId } });

    res.json({ message: "SuperAdmin deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create admin profile
router.post("/:superAdminId/admins", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { email, password, username, adminLevel, departmentId, buildingId } =
    req.body;
  let firebaseUser;

  try {
    const role = await prisma.role.findUnique({ where: { name: "ADMIN" } });

    firebaseUser = await admin.auth().createUser({ email, password });

    const user = await prisma.user.create({
      data: { username, uniEmail: email, roleId: role.id },
    });

    const adminProfile = await prisma.admin.create({
      data: { userId: user.id, adminLevel, departmentId, buildingId },
    });

    res.status(201).json({ user, admin: adminProfile });
  } catch (err) {
    if (firebaseUser?.uid) await admin.auth().deleteUser(firebaseUser.uid);
    res.status(500).json({ message: err.message });
  }
});

// Update admin profile
router.put("/:superAdminId/admins/:adminId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { adminId } = req.params;

  try {
    const adminRec = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!adminRec) return res.status(404).json({ message: "Admin not found" });

    const user = await prisma.user.update({
      where: { id: adminRec.userId },
      data: req.body,
    });

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: req.body,
    });

    res.json({ user, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete admin profile
router.delete("/:superAdminId/admins/:adminId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { adminId } = req.params;

  try {
    const adminRec = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { user: true },
    });

    if (!adminRec) return res.status(404).json({ message: "Admin not found" });

    try {
      const fb = await admin.auth().getUserByEmail(adminRec.user.uniEmail);
      await admin.auth().deleteUser(fb.uid);
    } catch {}

    await prisma.admin.delete({ where: { id: adminId } });
    await prisma.user.delete({ where: { id: adminRec.userId } });

    res.json({ message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create student profile
router.post("/:superAdminId/students", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const {
    email,
    password,
    username,
    iitIdNumber,
    societyName,
    societyPosition,
  } = req.body;
  let firebaseUser;

  try {
    const role = await prisma.role.findUnique({ where: { name: "STUDENT" } });

    firebaseUser = await admin.auth().createUser({ email, password });

    const user = await prisma.user.create({
      data: { username, uniEmail: email, roleId: role.id },
    });

    const student = await prisma.student.create({
      data: { userId: user.id, iitIdNumber, societyName, societyPosition },
    });

    res.status(201).json({ user, student });
  } catch (err) {
    if (firebaseUser?.uid) await admin.auth().deleteUser(firebaseUser.uid);
    res.status(500).json({ message: err.message });
  }
});

// Update student profile
router.put("/:superAdminId/students/:studentId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { studentId } = req.params;

  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: req.body,
    });

    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete student profile
router.delete("/:superAdminId/students/:studentId", async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "SuperAdmin access only" });
  }

  const { studentId } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    try {
      const fb = await admin.auth().getUserByEmail(student.user.uniEmail);
      await admin.auth().deleteUser(fb.uid);
    } catch {}

    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.delete({ where: { id: student.userId } });

    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
