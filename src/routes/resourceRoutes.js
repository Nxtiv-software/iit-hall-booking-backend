import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        department: true,
      }
    });

    return res.json(resources);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get all available resources
router.get("/available", async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { isAvailable: true },
      include: {
        department: true,
      }
    });

    return res.json(resources);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
