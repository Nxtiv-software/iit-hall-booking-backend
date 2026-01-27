import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all venues
router.get("/", async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      include: { building: true },
  });

    return res.json(venues);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get a specific venue
router.get("/:venueId", async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await prisma.venue.findFirst({
      where: { venueId },
      include: { building: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    return res.json(venue);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
