import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Book a booking
router.post("/", async (req, res) => {
  const { title, description } = req.body;
  try {
    const booking = await prisma.booking.create({
      data: {
        title,
        description,
        userId: req.user.id,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
    res.status(201).json({
      message: "Booking created successfully. Waiting for admin1 approval.",
      booking,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
