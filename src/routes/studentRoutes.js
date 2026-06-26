import express from "express";
import prisma from "../prismaClient.js";
import admin from "../Firebase/firebaseAdmin.js";

const router = express.Router();

//Get student profile
router.get("/me", async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.json({ student });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Create student profile
router.post("/me", async (req, res) => {
  try {
    const {
      iitIdNumber,
      societyName,
      societyPosition,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
    } = req.body;

    const studentExist = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (studentExist) {
      return res
        .status(400)
        .json({ message: "Student profile already exists" });
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

    const student = await prisma.student.create({
      data: {
        iitIdNumber,
        societyName,
        societyPosition,
        user: {
          connect: { id: req.user.id },
        },
      },
    });

    return res.status(201).json({
      message: "Student profile created successfully",
      student,
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Update student profile
router.put("/me", async (req, res) => {
  try {
    const {
      iitIdNumber,
      societyName,
      societyPosition,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
    } = req.body;

    const studentExist = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentExist) {
      return res.status(400).json({ message: "Student profile not found" });
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

    const student = await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        iitIdNumber,
        societyName,
        societyPosition,
      },
    });

    return res.json({
      message: "Student profile updated successfully",
      student,
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Delete student profile
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

    await prisma.student.delete({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      message: "Student profile, user account, and Firebase account deleted successfully",
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Creating a request by a student
router.post("/requests", async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const {
      form1Data,
      form2Data,
      form3Data,
      form4Data,
      form5Data,
      venueId,
      requiredDate,
      resourceIds,
    } = req.body;

    // Validate required fields
    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }

    if (!requiredDate) {
      return res.status(400).json({ message: "requiredDate is required" });
    }

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: "At least one resourceId is required" });
    }

    // Combine all form data
    const formData = {
      form1: form1Data || {},
      form2: form2Data || {},
      form3: form3Data || {},
      form4: form4Data || {},
      form5: form5Data || {},
    };

    // Extract common fields from form1Data for easy access
    const title = form1Data?.eventtitle || "";
    const description = form1Data?.description || "";
    const attendance = form1Data?.participants
      ? parseInt(form1Data.participants)
      : null;

    const status = await prisma.status.findUnique({
      where: { name: "PENDING" },
    });

    if (!status) {
      return res.status(500).json({ message: "Default status not found" });
    }

    const newRequest = await prisma.request.create({
      data: {
        student: {
          connect: { id: student.id },
        },
        venue: {
          connect: { id: venueId },
        },
        status: {
          connect: { id: status.id },
        },
        title,
        description,
        attendance,
        formData: formData,
        requiredDate: new Date(requiredDate),
        resources: {
          create: resourceIds.map(resourceId => ({
            resourceId: resourceId
          }))
        },
      },
      include: {
        student: {
          include: { user: true },
        },
        venue: true,
        status: true,
        resources: {
          include: { resource: { include: { department: true } } },
        },
      },
    });

    return res.status(201).json({
      message: "Request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error creating request:", error);
    return res.status(500).json({ message: error.message });
  }
});

//Get all requests by student id
router.get("/:studentId/requests", async (req, res) => {
  try {
    const { studentId } = req.params;

    const requests = await prisma.request.findMany({
      where: { studentId },
      include: {
        student: {
          include: { user: true },
        },
        venue: true,
        status: true,
        attachments: true,
        approvals: {
          include: {
            admin: {
              include: { user: true },
            },
            status: true,
          },
        },
        requestSlots: {
          include: {
            timeSlot: true,
          },
        },
        bookings: {
          include: {
            admin: {
              include: { user: true },
            },
          },
        },
      },
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get all pending requests by student id
router.get("/:studentId/requests/pending", async (req, res) => {
  try {
    const { studentId } = req.params;

    const pendingStatus = await prisma.status.findUnique({
      where: { name: "PENDING" }
    })

    if(!pendingStatus){
      return res.status(404).json({ message: "Pending status not found" });
    }

    const requests = await prisma.request.findMany({
      where: { 
        studentId,
        statusId: pendingStatus.id,
      },
      include: {
        student: {
          include: { user: true },
        },
        venue: true,
        status: true,
        attachments: true,
        approvals: {
          include: {
            admin: {
              include: { user: true },
            },
            status: true,
          },
        },
        bookings: {
          include: {
            admin: {
              include: { user: true },
            },
          },
        },
      },
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get all rejected requests by student id
router.get("/:studentId/requests/rejected", async (req, res) => {
  try {
    const { studentId } = req.params;

    const rejectedStatus = await prisma.status.findUnique({
      where: { name: "REJECTED" }
    })

    if(!rejectedStatus){
      return res.status(404).json({ message: "Rejected status not found" });
    }

    const requests = await prisma.request.findMany({
      where: { 
        studentId,
        statusId: rejectedStatus.id,
      },
      include: {
        student: {
          include: { user: true },
        },
        venue: true,
        status: true,
        attachments: true,
        approvals: {
          include: {
            admin: {
              include: { user: true },
            },
            status: true,
          },
        },
        bookings: {
          include: {
            admin: {
              include: { user: true },
            },
          },
        },
      },
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


//Get all bookings by student id
router.get("/:studentId/bookings", async (req, res) => {
  try {
    const { studentId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        request: {
          studentId: studentId,
        },
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

// Get the upcoming bookings for the following week of a student
router.get("/:studentId/bookings/upcoming-week", async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = await prisma.booking.findMany({
      where: {
        request: {
          requiredDate: {
            gte: today,
            lte: nextWeek,
          },
          studentId: studentId
        },
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
              include: { user: true },
            },
            venue: true,
            status: true,
          },
        },
      },
      orderBy: {
        request: {
          requiredDate: "asc",
        },
      },
    });

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Get total count of pending requests by student id
router.get("/:studentId/requests/pending/count", async (req, res) => {
  try {
    const { studentId } = req.params;

    const pendingStatus = await prisma.status.findUnique({
      where: { name: "PENDING" }
    });

    if (!pendingStatus) {
      return res.status(404).json({ message: "Pending status not found" });
    }

    const count = await prisma.request.count({
      where: { 
        studentId: studentId,
        statusId: pendingStatus.id, 
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Get total count of rejected requests by student id
router.get("/:studentId/requests/rejected/count", async (req, res) => {
  try {
    const { studentId } = req.params;

    const rejectedStatus = await prisma.status.findUnique({
      where: { name: "REJECTED" }
    });

    if (!rejectedStatus) {
      return res.status(404).json({ message: "Rejected status not found" });
    }

    const count = await prisma.request.count({
      where: { 
        studentId: studentId,
        statusId: rejectedStatus.id, 
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Get total count of bookings by student id
router.get("/:studentId/bookings/count", async (req, res) => {
  try {
    const { studentId } = req.params;

    const count = await prisma.booking.count({
      where: {
        request: {
          studentId: studentId,
        },
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get total student count
router.get("/count", async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();

    return res.json({ totalStudents });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get a request by student Id 
router.get("/:studentId/requests/:requestId", async (req, res) => {
  try {
    const { studentId, requestId } = req.params;

    const student = await prisma.student.findUnique({ 
      where: { id: studentId } 
    });
    if (!student) 
      return res.status(404).json({ message: "Student not found" });

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
