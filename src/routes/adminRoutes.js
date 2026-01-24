import express from "express";
import prisma from "../prismaClient.js";
import admin from "../Firebase/firebaseAdmin.js";

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

    const adminData = {
      adminLevel,
      user: {
        connect: { id: req.user.id },
      },
    };

    // Only connect building if buildingId is provided
    if (buildingId) {
      adminData.building = {
        connect: { id: buildingId },
      };
    }

    // Only connect department if departmentId is provided
    if (departmentId) {
      adminData.department = {
        connect: { id: departmentId },
      };
    }

    const admin = await prisma.admin.create({
      data: adminData,
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

    const adminUpdateData = {
      adminLevel,
    };

    // Handle building connection/disconnection
    if (buildingId !== undefined) {
      adminUpdateData.building = buildingId
        ? { connect: { id: buildingId } }
        : { disconnect: true };
    }

    // Handle department connection/disconnection
    if (departmentId !== undefined) {
      adminUpdateData.department = departmentId
        ? { connect: { id: departmentId } }
        : { disconnect: true };
    }

    const admin = await prisma.admin.update({
      where: { userId: req.user.id },
      data: adminUpdateData,
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
    const userId = req.user.id;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userRecord) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      const firebaseUser = await admin.auth().getUserByEmail(userRecord.uniEmail);
      await admin.auth().deleteUser(firebaseUser.uid);
    } catch (firebaseError) {
      console.warn("Firebase user not found or already deleted:", firebaseError.message);
    }

    await prisma.admin.delete({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      message: "Admin profile, user account, and Firebase account deleted successfully",
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
        adminId: adminId,
      },
      include: {
        admin: {
          include: {
            user: true,
          },
        },
        request: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            venue: true,
            status: true,
          },
        },
      },
    });

    return res.json(bookings);
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

    return res.json({
      message: "Comment updated successfully",
      approval: updatedApproval,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get count of pending requests for a specific admin level
router.get("/:adminId/pending-count", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({ 
      where: { id: adminId } 
    });
    if (!admin) 
      return res.status(404).json({ message: "Admin not found" });

    const pendingStatus = await prisma.status.findUnique({ 
      where: { name: "PENDING" } 
    });
    if (!pendingStatus) 
      return res.status(500).json({ message: "Pending status not found" });

    const pendingCount = await prisma.request.count({
      where: {
        statusId: pendingStatus.id,
        approvals: { none: { adminLevel: admin.adminLevel } },
      },
    });

    return res.json({ totalPending: pendingCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Add a resource
router.post(
  "/:adminId/departments/:departmentId/resources",
  async (req, res) => {
    try {
      const { adminId, departmentId } = req.params;
      const { name, isAvailable } = req.body;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) return res.status(403).json({ message: "Not admin" });

      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department)
        return res.status(404).json({ message: "Department not found" });

      const resource = await prisma.resource.create({
        data: {
          name,
          isAvailable,
          departmentId,
        },
      });

      return res.json({
        message: "Resource Added!",
        resource,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

//Update a resource
router.put(
  "/:adminId/departments/:departmentId/resources/:resourceId",
  async (req, res) => {
    try {
      const { adminId, departmentId, resourceId } = req.params;
      const { name, isAvailable } = req.body;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) return res.status(403).json({ message: "Not admin" });

      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department)
        return res.status(404).json({ message: "Department not found" });

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
        },
      });

      if (!resource)
        return res
          .status(404)
          .json({ message: "Resource not found in this department" });

      const updatedResource = await prisma.resource.update({
        where: { id: resourceId },
        data: {
          departmentId,
          name,
          isAvailable,
        },
      });

      return res.json({
        message: "Resource Updated!",
        updatedResource,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

//Delete a resource
router.delete(
  "/:adminId/departments/:departmentId/resources/:resourceId",
  async (req, res) => {
    try {
      const { adminId, departmentId, resourceId } = req.params;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) return res.status(403).json({ message: "Not admin" });

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          departmentId,
        },
      });

      if (!resource)
        return res
          .status(404)
          .json({ message: "Resource not found in this department" });

      await prisma.resource.delete({
        where: { id: resourceId },
      });

      return res.json({
        message: "Resource Deleted!",
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

//Add a venue
router.post("/:adminId/buildings/:buildingId/venues", async (req, res) => {
  try {
    const { adminId, buildingId } = req.params;
    const {
      name,
      description,
      type,
      capacityAcademic,
      capacityExamination,
      floorNumber,
      isAvailable,
    } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) return res.status(403).json({ message: "Not admin" });

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building)
      return res.status(404).json({ message: "Building not found" });

    const venue = await prisma.venue.create({
      data: {
        name,
        description,
        type,
        capacityAcademic,
        capacityExamination,
        floorNumber,
        isAvailable,
        buildingId,
      },
    });

    return res.json({
      message: "Venue Added!",
      venue,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Update a venue
router.put(
  "/:adminId/buildings/:buildingId/venues/:venueId",
  async (req, res) => {
    try {
      const { adminId, buildingId, venueId } = req.params;
      const {
        name,
        description,
        type,
        capacityAcademic,
        capacityExamination,
        floorNumber,
        isAvailable,
      } = req.body;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) return res.status(403).json({ message: "Not admin" });

      const building = await prisma.building.findUnique({
        where: { id: buildingId },
      });

      if (!building)
        return res.status(404).json({ message: "Building not found" });

      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
        },
      });

      if (!venue)
        return res
          .status(404)
          .json({ message: "Venue not found in this building" });

      const updatedVenue = await prisma.venue.update({
        where: { id: venueId },
        data: {
          buildingId,
          name,
          description,
          type,
          capacityAcademic,
          capacityExamination,
          floorNumber,
          isAvailable,
        },
      });

      return res.json({
        message: "Venue Updated!",
        updatedVenue,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

//Delete a venue
router.delete(
  "/:adminId/buildings/:buildingId/venues/:venueId",
  async (req, res) => {
    try {
      const { adminId, buildingId, venueId } = req.params;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) return res.status(403).json({ message: "Not admin" });

      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          buildingId,
        },
      });

      if (!venue)
        return res
          .status(404)
          .json({ message: "Venue not found in this building" });

      await prisma.venue.delete({
        where: { id: venueId },
      });

      return res.json({
        message: "Venue Deleted!",
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

// Get the pending requests of admin 1
router.get("/:adminId/admin1/pending", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 1) 
      return res.status(404).json({ message: "Admin1 not found" });

    const pendingStatus = await prisma.status.findUnique({ where: { name: "PENDING" } });

    const requests = await prisma.request.findMany({
        where: {
            statusId: pendingStatus.id,
            approvals: { none: { adminLevel: 1, statusId: pendingStatus.id } },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin1 rejected requests
router.get("/:adminId/admin1/rejected", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 1)
      return res.status(404).json({ message: "Admin1 not found" });

    const rejectedStatus = await prisma.status.findUnique({ 
        where: { name: "REJECTED" } 
    });

    const requests = await prisma.request.findMany({
        where: {
            approvals: { some: { adminLevel: 1, statusId: rejectedStatus.id } },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin2 pending requests
router.get("/:adminId/admin2/pending", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 2) 
        return res.status(404).json({ message: "Admin2 not found" });

    const pending = await prisma.status.findUnique({ where: { name: "PENDING" } });
    const approved = await prisma.status.findUnique({ where: { name: "APPROVED" } });
    if (!pending || !approved)
        return res.status(500).json({ message: "Statuses not found" });

    const requests = await prisma.request.findMany({
        where: {
            statusId: pending.id,
            approvals: {
            none: { adminLevel: 2, statusId: pending.id },
            some: { adminLevel: 1, statusId: approved.id }, 
            },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin2 rejected requests
router.get("/:adminId/admin2/rejected", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 2) 
        return res.status(404).json({ message: "Admin2 not found" });

    const rejected = await prisma.status.findUnique({ 
        where: { name: "REJECTED" } 
    });
    if (!rejected) 
        return res.status(500).json({ message: "Rejected status not found" });

    const requests = await prisma.request.findMany({
        where: { 
            approvals: { 
                some: { 
                    adminLevel: 2, 
                    statusId: rejected.id 
                } 
            } 
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin3 pending requests
router.get("/:adminId/admin3/pending", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 3) 
        return res.status(404).json({ message: "Admin3 not found" });

    const pending = await prisma.status.findUnique({ where: { name: "PENDING" } });
    const approved = await prisma.status.findUnique({ where: { name: "APPROVED" } });
    if (!pending || !approved) 
        return res.status(500).json({ message: "Statuses not found" });

    const requests = await prisma.request.findMany({
        where: {
          statusId: pending.id,
          approvals: {
            none: { adminLevel: 3, statusId: pending.id },
          },
          AND: [
            {
              approvals: {
                some: { adminLevel: 1, statusId: approved.id },
              },
            },
            {
              approvals: {
                some: { adminLevel: 2, statusId: approved.id },
              },
            },
          ],
          venue: { buildingId: admin.buildingId },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get rejected requests of admin3
router.get("/:adminId/admin3/rejected", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 3) 
        return res.status(404).json({ message: "Admin3 not found" });

    const rejected = await prisma.status.findUnique({ where: { name: "REJECTED" } });
    if (!rejected) 
        return res.status(500).json({ message: "Rejected status not found" });

    const requests = await prisma.request.findMany({
        where: {
            approvals: { 
                some: { 
                    adminLevel: 3, 
                    statusId: rejected.id 
                } 
            },
            venue: { buildingId: admin.buildingId },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true 
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin4 pending requests
router.get("/:adminId/admin4/pending", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 4) 
        return res.status(404).json({ message: "Admin4 not found" });

    const pending = await prisma.status.findUnique({ where: { name: "PENDING" } });
    const approved = await prisma.status.findUnique({ where: { name: "APPROVED" } });
    if (!pending || !approved) return res.status(500).json({ message: "Statuses not found" });

    const requests = await prisma.request.findMany({
        where: {
            statusId: pending.id,
            approvals: {
              none: { adminLevel: 4, statusId: pending.id },
            },
            AND: [
            {
              approvals: {
                some: { adminLevel: 1, statusId: approved.id },
              },
            },
            {
              approvals: {
                some: { adminLevel: 2, statusId: approved.id },
              },
            },
            {
              approvals: {
                some: { adminLevel: 3, statusId: approved.id },
              },
            },
          ],
          resources: {
            some: {
              resource: { departmentId: admin.departmentId },
            },
          },
        },
        include: { 
          student: { 
              include: { user: true } 
          }, 
          venue: true, 
          status: true,
          resources: { 
            include: { 
              resource: { 
                include: { department: true } 
              } 
            }
          },
        },
    });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get admin4 rejected requests
router.get("/:adminId/admin4/rejected", async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await prisma.admin.findUnique({ 
        where: { id: adminId } 
    });
    if (!admin || admin.adminLevel !== 4) 
        return res.status(404).json({ message: "Admin4 not found" });

    const rejected = await prisma.status.findUnique({ where: { name: "REJECTED" } });
    if (!rejected) 
        return res.status(500).json({ message: "Rejected status not found" });

    const requests = await prisma.request.findMany({
        where: {
          approvals: { 
              some: { 
                  adminLevel: 4, 
                  statusId: rejected.id 
              } 
          },
          resources: {
            some: {
              resource: { departmentId: admin.departmentId },
            },
          },
        },
        include: { 
            student: { 
                include: { user: true } 
            }, 
            venue: true, 
            status: true,
            resources: { include: { resource: { include: { department: true } } } },
        },
    });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Approve a request for a specific admin level
router.post("/:adminId/requests/:requestId/approve", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;
    const { comment } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) 
      return res.status(403).json({ message: "Admin not found" });

    const approvedStatus = await prisma.status.findUnique({ where: { name: "APPROVED" } });
    if (!approvedStatus) 
      return res.status(500).json({ message: "Approved status not found" });

    if (admin.adminLevel > 1) {
      const prevLevelApproval = await prisma.approval.findFirst({
        where: {
          requestId,
          adminLevel: admin.adminLevel - 1,
          statusId: approvedStatus.id,
        },
      });
      if (!prevLevelApproval)
        return res.status(403).json({
          message: `Approval from admin level ${admin.adminLevel - 1} is required first`,
        });
    }

    // Create approval
    const approval = await prisma.approval.create({
      data: {
        requestId,
        adminId: admin.id,
        adminLevel: admin.adminLevel,
        statusId: approvedStatus.id,
        comment,
      },
    });

    if (admin.adminLevel === 4) {
      await prisma.request.update({
        where: { id: requestId },
        data: { statusId: approvedStatus.id },
      });

      await prisma.booking.create({
        data: { requestId, adminId: admin.id },
      });
    }

    return res.json({ message: "Request approved successfully", approval });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Reject a request
router.post("/:adminId/requests/:requestId/reject", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;
    const { comment } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) 
      return res.status(403).json({ message: "Admin not found" });

    const rejectedStatus = await prisma.status.findUnique({ 
      where: { name: "REJECTED" } 
    });
    if (!rejectedStatus) 
      return res.status(500).json({ message: "Rejected status not found" });

    // Create rejection approval
    const approval = await prisma.approval.create({
      data: {
        requestId,
        adminId: admin.id,
        adminLevel: admin.adminLevel,
        statusId: rejectedStatus.id,
        comment,
      },
    });

    await prisma.request.update({
      where: { id: requestId },
      data: { statusId: rejectedStatus.id },
    });

    return res.json({ message: "Request rejected successfully", approval });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get a request by ID 
router.get("/:adminId/requests/:requestId", async (req, res) => {
  try {
    const { adminId, requestId } = req.params;

    const admin = await prisma.admin.findUnique({ 
      where: { id: adminId } 
    });
    if (!admin) 
      return res.status(404).json({ message: "Admin not found" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        student: { 
          include: { user: true } 
        },
        venue: {
          include: { building: true },
        },
        status: true,
        approvals: { 
          include: { 
            admin: { 
              include: { user: true } 
            } 
          } 
        },
        bookings: true,
      },
    });

    if (!request) 
      return res.status(404).json({ message: "Request not found" });

    return res.json({ request });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


export default router;
