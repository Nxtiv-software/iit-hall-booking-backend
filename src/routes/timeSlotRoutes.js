import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all time slots
router.get("/", async (req, res) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany();

    res.json(timeSlots);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
