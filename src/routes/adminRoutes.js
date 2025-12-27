import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get admin profile
router.get("/me", async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
      include: { 
        user: true,
        building: true,
        department: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    return res.json({ admin });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Create admin profile
router.post("/me", async (req, res) => {
  try {
    const { 
      adminLevel,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
      buildingId,
      departmentId,
    } = req.body;

    const adminExist = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (adminExist) {
      return res.status(400).json({ message: "Admin profile already exists" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        gender,
        avatarUrl,
        phoneNum,
        uniEmail,
      },
    });

    const admin = await prisma.admin.create({
      data: {
        adminLevel,
        buildingId,
        departmentId,
        user: {
          connect: { id: req.user.id },
        },
      },
    });

    return res.status(201).json({
      message: "Admin profile created successfully",
      admin,
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Update admin profile
router.put("/me", async (req, res) => {
  try {
    const { 
      adminLevel,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
      buildingId,
      departmentId,
     } = req.body;

    const adminExist = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!adminExist) {
      return res.status(400).json({ message: "Admin profile not found" });
    }

    await prisma.user.update({
        where: { id: req.user.id },
        data: {
            firstName,
            lastName,
            gender,
            avatarUrl,
            phoneNum,
            uniEmail,
        },
    });

    const admin = await prisma.admin.update({
        where: { userId: req.user.id },
        data: {
            adminLevel,
            buildingId,
            departmentId,
        },
    });


    return res.json({
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Delete admin profile
router.delete("/me", async (req, res) => {
  try {

    await prisma.admin.delete({
      where: { userId: req.user.id },
    });

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    return res.json({
      message: "Admin profile and user account deleted successfully",
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Get all bookings by admin id
router.get("/:adminId/bookings", async (req, res) => {
  try {
const { adminId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        adminId: adminId 
      },
      include: {
        admin: {
          include: {
            user: true
          }
        },
        request: {
          include: {
            student: {
              include: {
                user: true,
              }
            },
            venue: true,
            status: true,
          }
        },
      }
    });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get pending requests by admin level, building and department
router.get("/:adminId/pending-requests", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) 
      return res.status(403).json({ message: "Not admin" });

    const level = admin.adminLevel;

    let filter = {};

    if (level === 3) {
      filter = {
        venue: { buildingId: admin.buildingId }
      };
    }

    if (level === 4) {
      filter = {
        departmentId: admin.departmentId
      };
    }

    const status = await prisma.status.findUnique({
      where: { name: "PENDING" }
    });

    if (!status) 
      return res.status(500).json({ message: "Pending status not found" });

    let approvalFilter = {};

    if (level === 1) {
      // Level 1 sees all pending requests
      approvalFilter = {};
    } else {
      // Level 2, 3, 4: must have approvals from all previous levels
      const requiredLevels = Array.from({ length: level - 1 }, (_, i) => i + 1); // e.g., level 3 → [1,2]
      approvalFilter = {
        every: {
          OR: requiredLevels.map(l => ({ adminLevel: l }))
        }
      };
    }

    const requests = await prisma.request.findMany({
      where: {
        statusId: status.id,
        approvals: {
          none: { adminLevel: level }, 
          ...approvalFilter
        },
        ...filter
      },
      include: {
        student: { include: { user: true } },
        venue: true,
        status: true,
      }
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get rejected requests for admin
router.get("/:adminId/rejected-requests", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) 
      return res.status(403).json({ message: "Not admin" });

    const level = admin.adminLevel;

    let filter = {};

    if (level === 3) {
      filter = {
        venue: { buildingId: admin.buildingId }
      };
    }

    if (level === 4) {
      filter = {
        departmentId: admin.departmentId
      };
    }

    const status = await prisma.status.findUnique({
      where: { name: "REJECTED" }
    });

    if (!status) 
      return res.status(500).json({ message: "Rejected status not found" });

    // Hierarchical approval filter
    let approvalFilter = {};

    if (level === 1) {
      // Level 1 sees all rejected requests
      approvalFilter = {};
    } else {
      // Levels 2-4: must have approvals from all previous levels
      const requiredLevels = Array.from({ length: level - 1 }, (_, i) => i + 1); 
      approvalFilter = {
        every: {
          OR: requiredLevels.map(l => ({ adminLevel: l }))
        }
      };
    }

    const requests = await prisma.request.findMany({
      where: {
        statusId: status.id, 
        approvals: approvalFilter,
        ...filter
      },
      include: {
        student: { include: { user: true } },
        venue: true,
        status: true,
      }
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


//Approve a request
router.post("/:adminId/requests/:requestId/approve", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;
    const { comment } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) 
      return res.status(403).json({ message: "Not admin" });

    const status = await prisma.status.findUnique({
      where: { name: "APPROVED" }
    });

    if (!status) return res.status(500).json({ message: "Status not found" });

    // Create approval
    const approval = await prisma.approval.create({
      data: {
        requestId,
        adminId: admin.id,
        adminLevel: admin.adminLevel,
        statusId: status.id,
        comment,
      }
    });

    // Check how many approvals exist
    const approvals = await prisma.approval.findMany({
      where: { requestId },
      orderBy: { adminLevel: "asc" }
    });

    const approvedLevels = approvals.map(a => a.adminLevel);

    const requiredLevels = [1, 2, 3, 4];

    const isComplete = requiredLevels.every(l => approvedLevels.includes(l));

    if (isComplete) {
      // Mark request as fully approved
      await prisma.request.update({
        where: { id: requestId },
        data: { statusId: status.id },
      });

      // Create booking entry
      await prisma.booking.create({
        data: {
          requestId,
          adminId: admin.id
        }
      });
    }

    return res.json({ message: "Approved", approval });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Reject a request
router.post("/:adminId/requests/:requestId/reject", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;
    const { comment } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) 
      return res.status(403).json({ message: "Not admin" });

    const status = await prisma.status.findUnique({
      where: { name: "REJECTED" }
    });

    if (!status) return res.status(500).json({ message: "Status not found" });

    await prisma.approval.create({
      data: {
        requestId,
        adminId: admin.id,
        adminLevel: admin.adminLevel,
        statusId: status.id,
        comment
      }
    });

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: { statusId: status.id }
    });

    return res.json({ message: "Request rejected" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Update approval comment
router.put("/:adminId/requests/:requestId/approval", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;
    const { adminLevel, comment } = req.body; 

    const approval = await prisma.approval.findFirst({
      where: {
        adminId: adminId,
        requestId: requestId,
        adminLevel: adminLevel,
      },
    });

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: { comment },
    });

    return res.json({ message: "Comment updated successfully", approval: updatedApproval });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get count of pending requests for a specific admin
router.get("/:adminId/pending-count", async (req, res) => {
  try {
    const { adminId } = req.params;

    // Fetch admin info
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const level = admin.adminLevel;

    // Determine scope filter
    let filter = {};
    if (level === 3) filter = { venue: { buildingId: admin.buildingId } };
    if (level === 4) filter = { departmentId: admin.departmentId };

    // Get PENDING status
    const status = await prisma.status.findUnique({
      where: { name: "PENDING" },
    });

    if (!status) {
      return res.status(500).json({ message: "Pending status not found" });
    }

    // Hierarchical approval filter
    let approvalFilter = {};
    if (level > 1) {
      const requiredLevels = Array.from({ length: level - 1 }, (_, i) => i + 1);
      approvalFilter = {
        every: {
          OR: requiredLevels.map((l) => ({ adminLevel: l })),
        },
      };
    }

    // Count pending requests
    const pendingCount = await prisma.request.count({
      where: {
        statusId: status.id,
        approvals: {
          none: { adminLevel: level }, // not yet approved by this admin
          ...approvalFilter,
        },
        ...filter,
      },
    });

    return res.json({ totalPending: pendingCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
