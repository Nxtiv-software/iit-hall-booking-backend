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

export default router;
