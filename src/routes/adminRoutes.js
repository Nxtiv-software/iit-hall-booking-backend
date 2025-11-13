import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all the users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ users });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

export default router;
