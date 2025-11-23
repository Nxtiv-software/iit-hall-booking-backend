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
            user: true
          }
        },
        request: true
      }
    });

    res.json(bookings)
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
