import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all time slots
router.get("/", async (req, res) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany();

    return res.json(timeSlots);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
