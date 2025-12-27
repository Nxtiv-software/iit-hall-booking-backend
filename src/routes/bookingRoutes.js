import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
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

// Get total booking count 
router.get("/count", async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();

    return res.json({ totalBookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get the upcoming bookings for the following week
router.get("/upcoming-week", async (req, res) => {
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


export default router;
