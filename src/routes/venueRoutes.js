import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all venues
router.get("/", async (req, res) => {
  try {
    const venues = await prisma.venue.findMany();

    return res.json(venues);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
