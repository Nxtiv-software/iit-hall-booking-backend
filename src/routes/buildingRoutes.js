import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all buildings
router.get("/", async (req, res) => {
  try {
    const buildings = await prisma.building.findMany();

    return res.json(buildings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get venues for a specific building
router.get("/:buildingId/venues", async (req, res) => {
  const { buildingId } = req.params;

  try {
    const venues = await prisma.venue.findMany({
      where: { 
        buildingId,
        isAvailable: true
       },
    });

    if (!venues) {
      return res.status(404).json({ message: "No venues found for this building" });
    }

    return res.json(venues);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


export default router;
