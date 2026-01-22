import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// Create super admin profile
router.post("/me", async (req, res) => {
  try {
    const { username, firstName, lastName, uniEmail, gender, phoneNum } = req.body;

    const superAdminRole = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });

    if (!superAdminRole) {
      return res.status(400).json({ message: "SUPER_ADMIN role not found. Please seed roles." });
    }

    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        uniEmail,
        gender,
        phoneNum,
        role: { connect: { id: superAdminRole.id } },
      },
    });

    const superAdmin = await prisma.superAdmin.create({
      data: {
        userId: user.id,
      },
    });

    return res.status(201).json({
      message: "SuperAdmin created successfully",
      user,
      superAdmin,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId },
    });

    if (!superAdmin) {
      return res.status(404).json({ message: "SuperAdmin profile not found" });
    }

    await prisma.superAdmin.delete({
      where: { userId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: "SuperAdmin account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Create admin profile
router.post("/admins", async (req, res) => {
    const { 
        username,
        firstName,
        lastName,
        uniEmail,
        gender,
        phoneNum,
        adminLevel,
        departmentId,
        buildingId,
    } = req.body;

    try {
        const adminRole = await prisma.role.findUnique({
            where: { name: "ADMIN" },
        });

        if (!adminRole) {
            return res.status(500).json({ message: "ADMIN role not found" });
        }

        const user = await prisma.user.create({
            data: { 
                username, 
                firstName, 
                lastName, 
                uniEmail, 
                gender, 
                phoneNum, 
                roleId: adminRole.id 
            },
        });

        const admin = await prisma.admin.create({
            data: { 
                userId: user.id, 
                adminLevel, 
                departmentId, 
                buildingId 
            },
        });

        res.status(201).json({ user, admin });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        where: { id: adminId } 
    });

    if (!adminRecord) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const userId = adminRecord.userId;

    await prisma.admin.delete({ where: { id: adminId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student profile
router.post("/students", async (req, res) => {
    const { 
        username,
        firstName,
        lastName,
        uniEmail,
        gender,
        phoneNum,
        iitIdNumber,
        societyName, 
        societyPosition
    } = req.body;

    try {
        const studentRole = await prisma.role.findUnique({
            where: { name: "STUDENT" },
        });

        if (!studentRole) {
            return res.status(500).json({ message: "STUDENT role not found" });
        }

        const user = await prisma.user.create({
            data: { 
                username, 
                firstName, 
                lastName, 
                uniEmail, 
                gender, 
                phoneNum, 
                roleId: adminRole.id 
            },
        });

        const student = await prisma.student.create({
            data: { 
                userId: user.id, 
                iitIdNumber, 
                societyName, 
                societyPosition 
            },
        });

        res.status(201).json({ user, student });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    const studentRecord = await prisma.student.findUnique({ where: { id: studentId } });

    if (!studentRecord) {
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = studentRecord.userId;

    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;