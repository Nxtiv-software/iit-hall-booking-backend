import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all venues
router.get("/", async (req, res) => {
  try {
    const venues = await prisma.venue.findMany();

    res.json(venues);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
