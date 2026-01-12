import express from "express";
import prisma from "../prismaClient.js";

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
    await prisma.student.delete({
      where: { userId: req.user.id },
    });

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    return res.json({
      message: "Student profile and user account deleted successfully",
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
    } = req.body;

    // Validate required fields
    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }

    if (!requiredDate) {
      return res.status(400).json({ message: "requiredDate is required" });
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
        studentId: student.id,
        venueId,
        statusId: status.id,
        title,
        description,
        attendance,
        formData: formData,
        requiredDate: new Date(requiredDate),
      },
      include: {
        student: {
          include: { user: true },
        },
        venue: true,
        status: true,
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
        comments: {
          include: {
            admin: {
              include: { user: true },
            },
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

// Get the upcoming bookings for the following week
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

//Get total count of requests by student id
router.get("/:studentId/requests/count", async (req, res) => {
  try {
    const { studentId } = req.params;

    const count = await prisma.request.count({
      where: { studentId: studentId },
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

//Get total count of pending requests by student id
router.get("/:studentId/requests/pending/count", async (req, res) => {
  try {
    const pendingStatus = await prisma.status.findUnique({
      where: { name: "Pending" },
      select: { id: true },
    });

    if (!pendingStatus) {
      return res.status(404).json({ message: "Pending status not found" });
    }

    const count = await prisma.request.count({
      where: { statusId: pendingStatus.id },
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

export default router;
