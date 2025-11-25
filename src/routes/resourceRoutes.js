import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await prisma.resource.findMany();

    res.json(resources);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
