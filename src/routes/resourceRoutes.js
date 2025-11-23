import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await prisma.resources.findMany();

    res.json(statuses);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
